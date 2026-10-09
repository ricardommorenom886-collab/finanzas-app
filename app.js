/**
 * FinanzasPro - Personal Finance Application
 * Multiplataforma: Compatible con Microsoft Windows y Android (PWA)
 * Moneda principal: Pesos ($)
 * Con Gastos Fijos (Pagos Completos y Parciales con fecha por cada abono),
 * Metas de Ahorro, Límites de Gastos y Balance Mensual.
 */

// ================= CONSTANTES & CATEGORÍAS =================
const EXPENSE_CATEGORIES = [
  { id: 'vivienda', name: 'Vivienda & Alquiler', icon: 'home', color: 'blue' },
  { id: 'alimentacion', name: 'Alimentación & Super', icon: 'utensils', color: 'emerald' },
  { id: 'servicios', name: 'Servicios (Luz, Agua, Net)', icon: 'zap', color: 'amber' },
  { id: 'transporte', name: 'Transporte & Gasolina', icon: 'car', color: 'indigo' },
  { id: 'salud', name: 'Salud & Farmacia', icon: 'heart-pulse', color: 'rose' },
  { id: 'entretenimiento', name: 'Entretenimiento & Ocio', icon: 'film', color: 'purple' },
  { id: 'ropa', name: 'Ropa & Compras', icon: 'shopping-bag', color: 'pink' },
  { id: 'educacion', name: 'Educación & Libros', icon: 'book-open', color: 'cyan' },
  { id: 'otros_gastos', name: 'Otros Gastos', icon: 'more-horizontal', color: 'slate' }
];

const INCOME_CATEGORIES = [
  { id: 'salario', name: 'Salario / Nómina', icon: 'briefcase', color: 'emerald' },
  { id: 'negocio', name: 'Negocio / Ventas', icon: 'store', color: 'blue' },
  { id: 'inversiones', name: 'Inversiones & Rendimientos', icon: 'trending-up', color: 'purple' },
  { id: 'freelance', name: 'Freelance / Honorarios', icon: 'laptop', color: 'amber' },
  { id: 'regalo', name: 'Regalos / Bonos', icon: 'gift', color: 'pink' },
  { id: 'otros_ingresos', name: 'Otros Ingresos', icon: 'plus-circle', color: 'teal' }
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ================= ESTADO DE LA APLICACIÓN =================
const today = new Date();
let state = {
  currency: '$', // Pesos por defecto
  selectedYear: today.getFullYear(),
  selectedMonth: today.getMonth(), // 0 - 11
  transactions: [],
  goals: [],
  fixedExpenses: [], // Gastos fijos estipulados con soporte de pagos parciales/completos
  budgets: {
    globalLimit: 2800000,
    categoryLimits: {
      'Vivienda & Alquiler': 1200000,
      'Alimentación & Super': 600000,
      'Servicios (Luz, Agua, Net)': 350000,
      'Transporte & Gasolina': 300000,
      'Entretenimiento & Ocio': 200000
    }
  },
  theme: 'dark'
};

// Referencias de Charts
let categoryChartInstance = null;
let cashflowChartInstance = null;
let deferredPrompt = null; // Para PWA Install

// ================= INICIALIZACIÓN & DATOS POR DEFECTO =================
function initApp() {
  loadStoredData();
  setupEventListeners();
  setupTheme();
  setupPWA();
  renderApp();
}

function loadStoredData() {
  const savedState = localStorage.getItem('finanzaspro_data');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      state = { ...state, ...parsed };
      if (typeof state.selectedYear !== 'number') state.selectedYear = today.getFullYear();
      if (typeof state.selectedMonth !== 'number') state.selectedMonth = today.getMonth();
      if (!Array.isArray(state.fixedExpenses)) state.fixedExpenses = [];
    } catch (e) {
      console.error('Error parseando datos guardados:', e);
      loadDefaultDemoData();
    }
  } else {
    loadDefaultDemoData();
  }
}

function loadDefaultDemoData() {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${y}-${m}`;

  state.currency = '$'; // Pesos
  state.selectedYear = today.getFullYear();
  state.selectedMonth = today.getMonth();

  // 1. Gastos Fijos Estipulados (con pagos completos y abonos parciales con fecha)
  state.fixedExpenses = [
    {
      id: 'fix-1',
      concept: 'Arriendo de Vivienda',
      amount: 1100000,
      category: 'Vivienda & Alquiler',
      dueDay: 5,
      paymentMethod: 'Transferencia',
      notes: 'Transferencia bancaria al arrendador',
      paidMonths: [currentMonthKey],
      payments: [
        {
          id: 'pay-fix-1-1',
          monthKey: currentMonthKey,
          type: 'completo',
          amount: 1100000,
          date: `${y}-${m}-05`,
          paymentMethod: 'Transferencia',
          notes: 'Pago completo de canon de arriendo'
        }
      ]
    },
    {
      id: 'fix-2',
      concept: 'Servicios Públicos (Luz, Agua, Gas)',
      amount: 195000,
      category: 'Servicios (Luz, Agua, Net)',
      dueDay: 10,
      paymentMethod: 'Débito Automático',
      notes: 'Factura mensual unificada',
      paidMonths: [currentMonthKey],
      payments: [
        {
          id: 'pay-fix-2-1',
          monthKey: currentMonthKey,
          type: 'completo',
          amount: 195000,
          date: `${y}-${m}-08`,
          paymentMethod: 'Débito Automático',
          notes: 'Débito automático en cuenta'
        }
      ]
    },
    {
      id: 'fix-3',
      concept: 'Internet Fibra Óptica 300MB',
      amount: 90000,
      category: 'Servicios (Luz, Agua, Net)',
      dueDay: 15,
      paymentMethod: 'Tarjeta',
      notes: 'Pago mensual en línea',
      paidMonths: [],
      // EJEMPLO DE ABONO PARCIAL: Se pagaron $50.000 el día 6, restan $40.000 por liquidar
      payments: [
        {
          id: 'pay-fix-3-1',
          monthKey: currentMonthKey,
          type: 'parcial',
          amount: 50000,
          date: `${y}-${m}-06`,
          paymentMethod: 'Tarjeta',
          notes: 'Primer abono quincenal (restan $40.000)'
        }
      ]
    },
    {
      id: 'fix-4',
      concept: 'Plan Móvil Celular',
      amount: 45000,
      category: 'Servicios (Luz, Agua, Net)',
      dueDay: 18,
      paymentMethod: 'Débito Automático',
      notes: 'Línea pospago ilimitada',
      paidMonths: [],
      payments: []
    },
    {
      id: 'fix-5',
      concept: 'Suscripciones Streaming (Netflix + Spotify)',
      amount: 52000,
      category: 'Entretenimiento & Ocio',
      dueDay: 22,
      paymentMethod: 'Tarjeta',
      notes: 'Cobro automático mensual',
      paidMonths: [],
      payments: []
    },
    {
      id: 'fix-6',
      concept: 'Póliza de Salud / Seguro Médico',
      amount: 140000,
      category: 'Salud & Farmacia',
      dueDay: 28,
      paymentMethod: 'Transferencia',
      notes: 'Cobertura médica mensual',
      paidMonths: [],
      payments: []
    }
  ];

  // 2. Transacciones iniciales del mes (incluyen los pagos fijos de demo para sincronizar el balance)
  state.transactions = [
    {
      id: 'tx-1',
      type: 'income',
      amount: 3800000,
      category: 'Salario / Nómina',
      concept: 'Sueldo mensual principal',
      date: `${y}-${m}-01`,
      paymentMethod: 'Transferencia',
      notes: 'Nómina mensual regular',
      createdAt: Date.now() - 500000
    },
    {
      id: 'tx-2',
      type: 'income',
      amount: 650000,
      category: 'Freelance / Honorarios',
      concept: 'Proyecto de desarrollo web independiente',
      date: `${y}-${m}-06`,
      paymentMethod: 'Transferencia',
      notes: 'Pago por entregable final',
      createdAt: Date.now() - 400000
    },
    {
      id: 'tx-pay-pay-fix-1-1',
      type: 'expense',
      amount: 1100000,
      category: 'Vivienda & Alquiler',
      concept: '[Fijo] Arriendo de Vivienda (Pago Completo)',
      date: `${y}-${m}-05`,
      paymentMethod: 'Transferencia',
      notes: 'Pago completo de canon de arriendo',
      fixedExpenseId: 'fix-1',
      fixedPaymentId: 'pay-fix-1-1',
      createdAt: Date.now() - 350000
    },
    {
      id: 'tx-pay-pay-fix-2-1',
      type: 'expense',
      amount: 195000,
      category: 'Servicios (Luz, Agua, Net)',
      concept: '[Fijo] Servicios Públicos (Luz, Agua, Gas) (Pago Completo)',
      date: `${y}-${m}-08`,
      paymentMethod: 'Débito Automático',
      notes: 'Débito automático en cuenta',
      fixedExpenseId: 'fix-2',
      fixedPaymentId: 'pay-fix-2-1',
      createdAt: Date.now() - 300000
    },
    {
      id: 'tx-pay-pay-fix-3-1',
      type: 'expense',
      amount: 50000,
      category: 'Servicios (Luz, Agua, Net)',
      concept: '[Fijo] Internet Fibra Óptica 300MB (Abono Parcial)',
      date: `${y}-${m}-06`,
      paymentMethod: 'Tarjeta',
      notes: 'Primer abono quincenal (restan $40.000)',
      fixedExpenseId: 'fix-3',
      fixedPaymentId: 'pay-fix-3-1',
      createdAt: Date.now() - 280000
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 340000,
      category: 'Alimentación & Super',
      concept: 'Mercado y supermercado quincenal',
      date: `${y}-${m}-04`,
      paymentMethod: 'Tarjeta',
      notes: 'Despensa y víveres para el hogar',
      createdAt: Date.now() - 250000
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 85000,
      category: 'Transporte & Gasolina',
      concept: 'Carga de gasolina del vehículo',
      date: `${y}-${m}-07`,
      paymentMethod: 'Tarjeta',
      notes: 'Estación de combustible',
      createdAt: Date.now() - 200000
    },
    {
      id: 'tx-5',
      type: 'expense',
      amount: 95000,
      category: 'Entretenimiento & Ocio',
      concept: 'Cena de fin de semana con amigos',
      date: `${y}-${m}-08`,
      paymentMethod: 'Tarjeta',
      notes: 'Restaurante',
      createdAt: Date.now() - 100000
    }
  ];

  // 3. Metas de ahorro (en Pesos)
  state.goals = [
    {
      id: 'goal-1',
      title: 'Fondo de Emergencia (6 meses)',
      targetAmount: 12000000,
      currentAmount: 5500000,
      deadline: `${y}-12-31`,
      color: 'emerald'
    },
    {
      id: 'goal-2',
      title: 'Vacaciones de Fin de Año',
      targetAmount: 3500000,
      currentAmount: 1800000,
      deadline: `${y + 1}-06-15`,
      color: 'blue'
    },
    {
      id: 'goal-3',
      title: 'Renovación de Laptop / Computador',
      targetAmount: 2800000,
      currentAmount: 1200000,
      deadline: `${y}-11-30`,
      color: 'purple'
    }
  ];

  // 4. Límites de gastos (en Pesos)
  state.budgets = {
    globalLimit: 2800000,
    categoryLimits: {
      'Vivienda & Alquiler': 1200000,
      'Alimentación & Super': 600000,
      'Servicios (Luz, Agua, Net)': 350000,
      'Transporte & Gasolina': 300000,
      'Entretenimiento & Ocio': 200000
    }
  };

  saveState();
}

function saveState() {
  localStorage.setItem('finanzaspro_data', JSON.stringify(state));
}

// ================= HELPERS DE FORMATEO =================
function formatMoney(amount) {
  const num = Number(amount) || 0;
  const hasDecimals = num % 1 !== 0;
  const formatted = num.toLocaleString('es-CO', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
  return `${state.currency} ${formatted}`;
}

function getCategoryMeta(categoryName, type = 'expense') {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const match = list.find(c => c.name === categoryName);
  if (match) return match;
  return { id: 'general', name: categoryName, icon: type === 'income' ? 'plus-circle' : 'tag', color: 'slate' };
}

// Helper para calcular pagos de un gasto fijo en el mes seleccionado
function getFixedStatusForMonth(fixed, monthKey) {
  const total = Number(fixed.amount) || 0;
  if (!Array.isArray(fixed.payments)) fixed.payments = [];

  // Migración si venía de versión previa con paidMonths binario
  if (Array.isArray(fixed.paidMonths) && fixed.paidMonths.includes(monthKey)) {
    const hasAny = fixed.payments.some(p => p.monthKey === monthKey);
    if (!hasAny) {
      fixed.payments.push({
        id: `pay-${fixed.id}-${monthKey}`,
        monthKey: monthKey,
        type: 'completo',
        amount: total,
        date: `${monthKey}-${String(Math.min(fixed.dueDay || 5, 28)).padStart(2, '0')}`,
        paymentMethod: fixed.paymentMethod || 'Transferencia',
        notes: 'Pago completo registrado'
      });
    }
  }

  const payments = fixed.payments.filter(p => p.monthKey === monthKey);
  const paid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const pending = Math.max(0, total - paid);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  let status = 'pending'; // 'pending' | 'partial' | 'completed'
  if (paid >= total && total > 0) {
    status = 'completed';
  } else if (paid > 0) {
    status = 'partial';
  }

  return { total, paid, pending, pct, status, payments };
}

// ================= GESTIÓN DE TEMA & PWA =================
function setupTheme() {
  const savedTheme = localStorage.getItem('finanzaspro_theme') || 'dark';
  state.theme = savedTheme;
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  document.getElementById('btnToggleTheme').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    state.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('finanzaspro_theme', state.theme);
    renderCharts();
    safeCreateIcons();
  });
}

function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('ServiceWorker registrado:', reg.scope);
      }).catch((err) => {
        console.warn('Error registrando ServiceWorker:', err);
      });
    });
  }

  const btnInstall = document.getElementById('btnInstallApp');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstall.classList.remove('hidden');
    btnInstall.classList.add('flex');
  });

  btnInstall.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        btnInstall.classList.add('hidden');
      }
      deferredPrompt = null;
    } else {
      showToast('Para instalar: usa el menú de tu navegador y selecciona "Instalar aplicación"', 'info');
    }
  });
}

function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

// ================= RENDERIZADO GENERAL =================
function renderApp() {
  updateCurrencySymbols();
  renderMonthHeader();
  renderDashboard();
  renderTransactions();
  renderFixedExpenses();
  renderGoals();
  renderBudgets();
  safeCreateIcons();
}

function updateCurrencySymbols() {
  document.querySelectorAll('.currencySymbol').forEach(el => {
    el.textContent = state.currency;
  });
  const selector = document.getElementById('currencySelector');
  if (selector) selector.value = state.currency;
}

function renderMonthHeader() {
  const label = `${MONTH_NAMES[state.selectedMonth]} ${state.selectedYear}`;
  document.getElementById('currentMonthLabel').textContent = label;
  const pickerYearEl = document.getElementById('pickerYearLabel');
  if (pickerYearEl) pickerYearEl.textContent = state.selectedYear;
  const fixedMonthEl = document.getElementById('fixedMonthLabel');
  if (fixedMonthEl) fixedMonthEl.textContent = label;
}

// ================= RENDER TAB 1: DASHBOARD =================
function renderDashboard() {
  const currentMonthTransactions = getTransactionsForCurrentMonth();
  
  let totalIncome = 0;
  let incomeCount = 0;
  let totalExpense = 0;
  let expenseCount = 0;
  const categoryExpenses = {};

  currentMonthTransactions.forEach(tx => {
    const val = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += val;
      incomeCount++;
    } else {
      totalExpense += val;
      expenseCount++;
      categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + val;
    }
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100).toFixed(1) : '0.0';

  // KPIs
  document.getElementById('statIncome').textContent = formatMoney(totalIncome);
  document.getElementById('statIncomeCount').textContent = `${incomeCount} registro${incomeCount === 1 ? '' : 's'}`;

  document.getElementById('statExpense').textContent = formatMoney(totalExpense);
  document.getElementById('statExpenseCount').textContent = `${expenseCount} registro${expenseCount === 1 ? '' : 's'}`;

  const statBalanceEl = document.getElementById('statBalance');
  statBalanceEl.textContent = formatMoney(netBalance);
  if (netBalance >= 0) {
    statBalanceEl.className = 'text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate';
    document.getElementById('statSavingsRate').innerHTML = `<span class="text-emerald-500 font-semibold">Tasa de ahorro: ${savingsRate}%</span>`;
  } else {
    statBalanceEl.className = 'text-lg sm:text-2xl font-bold text-rose-600 dark:text-rose-400 truncate';
    document.getElementById('statSavingsRate').innerHTML = `<span class="text-rose-500 font-semibold">Déficit del mes: ${savingsRate}%</span>`;
  }

  // Límite mensual KPI
  const globalLimit = state.budgets.globalLimit || 0;
  const remainingBudget = globalLimit - totalExpense;
  const consumedPct = globalLimit > 0 ? Math.min(200, (totalExpense / globalLimit) * 100) : 0;

  document.getElementById('statBudgetRemaining').textContent = formatMoney(remainingBudget > 0 ? remainingBudget : 0);
  document.getElementById('statBudgetConsumed').textContent = `${consumedPct.toFixed(0)}% consumido`;
  document.getElementById('statBudgetLimitTotal').textContent = `de ${formatMoney(globalLimit)}`;

  const budgetBar = document.getElementById('statBudgetProgressBar');
  budgetBar.style.width = `${Math.min(100, consumedPct)}%`;
  if (consumedPct >= 100) {
    budgetBar.className = 'h-full bg-rose-500 transition-all duration-300';
  } else if (consumedPct >= 80) {
    budgetBar.className = 'h-full bg-amber-500 transition-all duration-300';
  } else {
    budgetBar.className = 'h-full bg-emerald-500 transition-all duration-300';
  }

  renderDashboardAlerts(totalExpense, globalLimit, categoryExpenses);
  renderRecentTransactions(currentMonthTransactions);
  renderDashboardFixedWidget();
  renderDashboardGoalsPreview();
  renderCharts(categoryExpenses, totalIncome, totalExpense);
}

function renderDashboardAlerts(totalExpense, globalLimit, categoryExpenses) {
  const banner = document.getElementById('dashboardAlertBanner');
  const badgeBudgetAlert = document.getElementById('badgeBudgetAlert');
  const alerts = [];

  if (globalLimit > 0 && totalExpense > globalLimit) {
    alerts.push(`Has superado tu límite global mensual por ${formatMoney(totalExpense - globalLimit)}.`);
  } else if (globalLimit > 0 && totalExpense >= globalLimit * 0.85) {
    alerts.push(`Atención: Estás al ${((totalExpense / globalLimit) * 100).toFixed(0)}% de tu límite global mensual.`);
  }

  for (const [catName, limit] of Object.entries(state.budgets.categoryLimits || {})) {
    const spent = categoryExpenses[catName] || 0;
    if (spent > limit) {
      alerts.push(`Has excedido el presupuesto en "${catName}" (${formatMoney(spent)} de ${formatMoney(limit)}).`);
    } else if (spent >= limit * 0.9) {
      alerts.push(`Cerca del límite en "${catName}" (${formatMoney(spent)} de ${formatMoney(limit)}).`);
    }
  }

  if (alerts.length > 0) {
    banner.classList.remove('hidden');
    banner.className = 'p-4 rounded-2xl border bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 space-y-1.5 animate-in fade-in';
    banner.innerHTML = `
      <div class="flex items-center gap-2 font-bold text-sm">
        <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-500 shrink-0"></i>
        <span>Avisos de Presupuesto para ${MONTH_NAMES[state.selectedMonth]}</span>
      </div>
      <ul class="text-xs space-y-1 list-disc list-inside text-rose-700 dark:text-rose-400 pl-1">
        ${alerts.map(a => `<li>${a}</li>`).join('')}
      </ul>
    `;
    badgeBudgetAlert.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
    badgeBudgetAlert.classList.add('hidden');
  }
}

function renderRecentTransactions(transactions) {
  const container = document.getElementById('recentTxList');
  if (!transactions.length) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-400 text-xs">
        <i data-lucide="receipt" class="w-7 h-7 mx-auto mb-2 opacity-50"></i>
        No hay transacciones registradas en este mes.
      </div>
    `;
    return;
  }

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  container.innerHTML = sorted.map(tx => {
    const isInc = tx.type === 'income';
    const meta = getCategoryMeta(tx.category, tx.type);
    return `
      <div class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isInc ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}">
            <i data-lucide="${meta.icon}" class="w-4 h-4"></i>
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">${escapeHTML(tx.concept)}</div>
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>${tx.date}</span>
              <span>•</span>
              <span class="truncate">${escapeHTML(tx.category)}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="font-bold text-xs sm:text-sm ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}">
            ${isInc ? '+' : '-'}${formatMoney(tx.amount)}
          </span>
          <button onclick="openEditTxModal('${tx.id}')" title="Modificar monto" class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-500 transition">
            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderDashboardGoalsPreview() {
  const container = document.getElementById('dashboardGoalsList');
  if (!state.goals.length) {
    container.innerHTML = `
      <div class="py-6 text-center text-slate-400 text-xs">
        <i data-lucide="target" class="w-6 h-6 mx-auto mb-1 opacity-50"></i>
        No tienes metas de ahorro activas.
      </div>
    `;
    return;
  }

  container.innerHTML = state.goals.slice(0, 3).map(goal => {
    const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    return `
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-800 dark:text-slate-200 truncate">${escapeHTML(goal.title)}</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400">${pct}%</span>
        </div>
        <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div class="bg-emerald-500 h-full rounded-full" style="width: ${pct}%"></div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>${formatMoney(goal.currentAmount)}</span>
          <span>de ${formatMoney(goal.targetAmount)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Widget de Gastos Fijos en el Dashboard (con soporte de pagos parciales)
function renderDashboardFixedWidget() {
  const container = document.getElementById('dashboardFixedWidget');
  if (!container) return;

  const currentMonthKey = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}`;
  
  let totalFixed = 0;
  let paidFixed = 0;
  const pendingItems = [];

  state.fixedExpenses.forEach(f => {
    const st = getFixedStatusForMonth(f, currentMonthKey);
    totalFixed += st.total;
    paidFixed += st.paid;
    if (st.status !== 'completed') {
      pendingItems.push({ fixed: f, ...st });
    }
  });

  const remainingFixed = Math.max(0, totalFixed - paidFixed);
  const pctPaid = totalFixed > 0 ? Math.round((paidFixed / totalFixed) * 100) : 0;

  if (!state.fixedExpenses.length) {
    container.innerHTML = `
      <div class="py-6 text-center text-slate-400 text-xs">
        <i data-lucide="calendar-clock" class="w-6 h-6 mx-auto mb-1 opacity-50"></i>
        No has estipulado gastos fijos aún.
      </div>
    `;
    return;
  }

  let pendingHTML = '';
  if (pendingItems.length > 0) {
    const nextPending = pendingItems.slice(0, 2);
    pendingHTML = `
      <div class="space-y-1.5 pt-1">
        <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Por liquidar este mes:</div>
        ${nextPending.map(item => `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs">
            <div class="min-w-0 pr-2">
              <div class="font-bold text-slate-800 dark:text-slate-200 truncate">${escapeHTML(item.fixed.concept)}</div>
              <div class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                ${item.status === 'partial' ? `Abonado ${formatMoney(item.paid)} (Resta ${formatMoney(item.pending)})` : `Resta ${formatMoney(item.total)} (Día ${item.fixed.dueDay})`}
              </div>
            </div>
            <button onclick="openFixedPaymentModal('${item.fixed.id}')" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition">
              ${item.status === 'partial' ? 'Abonar' : 'Pagar'}
            </button>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    pendingHTML = `
      <div class="py-2 text-center text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
        <i data-lucide="check-circle-2" class="w-4 h-4"></i>
        <span>¡Todos los gastos fijos del mes están completamente pagados!</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="text-slate-500">Comprometido: <strong class="text-slate-800 dark:text-slate-200">${formatMoney(totalFixed)}</strong></span>
        <span class="font-bold text-emerald-600 dark:text-emerald-400">${pctPaid}% pagado</span>
      </div>
      <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300" style="width: ${pctPaid}%"></div>
      </div>
      <div class="flex items-center justify-between text-[11px] text-slate-500">
        <span>Pagado: ${formatMoney(paidFixed)}</span>
        <span class="${remainingFixed > 0 ? 'text-amber-500 font-semibold' : 'text-emerald-500'}">Resta: ${formatMoney(remainingFixed)}</span>
      </div>
    </div>
    ${pendingHTML}
  `;
}

// ================= RENDERIZADO DE GRÁFICOS (CHART.JS) =================
function renderCharts(categoryExpenses, totalIncome, totalExpense) {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#cbd5e1' : '#475569';
  const gridColor = isDark ? '#334155' : '#f1f5f9';

  // Si no se pasaron parámetros (ej. cambio de tema), calcular con datos del mes actual
  if (!categoryExpenses || typeof totalIncome === 'undefined' || typeof totalExpense === 'undefined') {
    const currentMonthTxs = getTransactionsForCurrentMonth();
    totalIncome = 0;
    totalExpense = 0;
    categoryExpenses = {};
    currentMonthTxs.forEach(tx => {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += val;
      } else {
        totalExpense += val;
        categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + val;
      }
    });
  }

  // Actualizar label de gastos totales en tarjeta de categorías
  const chartTotalExpenseLabel = document.getElementById('chartTotalExpenseLabel');
  if (chartTotalExpenseLabel) {
    chartTotalExpenseLabel.textContent = formatMoney(totalExpense);
  }

  // Si Chart.js no está disponible (ej. sin conexión a internet), no romper la app
  if (typeof Chart === 'undefined') {
    return;
  }

  // 1. Gráfico de Dona: Gastos por Categoría
  const catCanvas = document.getElementById('categoryChart');
  const noDataNotice = document.getElementById('noChartDataNotice');

  if (catCanvas) {
    const categories = Object.keys(categoryExpenses).filter(cat => categoryExpenses[cat] > 0);
    const amounts = categories.map(cat => categoryExpenses[cat]);

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
      categoryChartInstance = null;
    }

    if (amounts.length === 0 || totalExpense === 0) {
      if (noDataNotice) noDataNotice.classList.remove('hidden');
      catCanvas.classList.add('hidden');
    } else {
      if (noDataNotice) noDataNotice.classList.add('hidden');
      catCanvas.classList.remove('hidden');

      const palette = [
        '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6',
        '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6', '#64748b'
      ];

      const ctx = catCanvas.getContext('2d');
      categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: categories,
          datasets: [{
            data: amounts,
            backgroundColor: categories.map((_, i) => palette[i % palette.length]),
            borderWidth: 2,
            borderColor: isDark ? '#0f172a' : '#ffffff',
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 10,
                color: textColor,
                font: { size: 11 }
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const val = context.raw || 0;
                  const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
                  return ` ${context.label}: ${formatMoney(val)} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  // 2. Gráfico de Barras: Comparativa Ingresos vs Gastos
  const cashflowCanvas = document.getElementById('cashflowChart');
  if (cashflowCanvas) {
    if (cashflowChartInstance) {
      cashflowChartInstance.destroy();
      cashflowChartInstance = null;
    }

    const net = totalIncome - totalExpense;
    const ctx = cashflowCanvas.getContext('2d');
    cashflowChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Ingresos', 'Gastos', 'Balance Neto'],
        datasets: [{
          label: 'Monto',
          data: [totalIncome, totalExpense, net],
          backgroundColor: [
            '#10b981',
            '#f43f5e',
            net >= 0 ? '#3b82f6' : '#f97316'
          ],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return ` ${context.label}: ${formatMoney(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 11, weight: '600' }
            }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 10 },
              callback: function (value) {
                return formatMoney(value);
              }
            }
          }
        }
      }
    });
  }
}

// ================= RENDER SECCIÓN DEDICADA: GASTOS FIJOS =================
let currentFixedFilter = 'all';

function renderFixedExpenses() {
  const container = document.getElementById('fixedExpensesGrid');
  if (!container) return;

  const currentMonthKey = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}`;
  
  let totalFixed = 0;
  let paidFixedAmount = 0;
  let pendingCount = 0;
  let completedCount = 0;

  state.fixedExpenses.forEach(f => {
    const st = getFixedStatusForMonth(f, currentMonthKey);
    totalFixed += st.total;
    paidFixedAmount += st.paid;
    if (st.status === 'completed') completedCount++;
    else pendingCount++;
  });

  const pendingFixedAmount = Math.max(0, totalFixed - paidFixedAmount);

  // Actualizar KPIs de la pestaña
  document.getElementById('statFixedTotal').textContent = formatMoney(totalFixed);
  document.getElementById('statFixedCountLabel').textContent = `${state.fixedExpenses.length} obligaciones fijas`;

  document.getElementById('statFixedPaid').textContent = formatMoney(paidFixedAmount);
  const paidPct = totalFixed > 0 ? Math.round((paidFixedAmount / totalFixed) * 100) : 0;
  document.getElementById('statFixedPaidPct').textContent = `${paidPct}% liquidado (${completedCount}/${state.fixedExpenses.length} completas)`;

  document.getElementById('statFixedPending').textContent = formatMoney(pendingFixedAmount);
  document.getElementById('statFixedPendingCount').textContent = `${pendingCount} con saldo pendiente`;

  // Actualizar Badges en Sidebar y Navegación Móvil
  const badgeFixedCount = document.getElementById('badgeFixedCount');
  if (badgeFixedCount) {
    badgeFixedCount.textContent = pendingCount;
    if (pendingCount > 0) {
      badgeFixedCount.className = 'text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold';
    } else {
      badgeFixedCount.className = 'text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    }
  }

  // Filtrado de lista
  let list = [...state.fixedExpenses];
  if (currentFixedFilter === 'pending') {
    list = list.filter(f => getFixedStatusForMonth(f, currentMonthKey).status !== 'completed');
  } else if (currentFixedFilter === 'paid') {
    list = list.filter(f => getFixedStatusForMonth(f, currentMonthKey).status === 'completed');
  }

  list.sort((a, b) => Number(a.dueDay) - Number(b.dueDay));

  if (!list.length) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <div class="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-3">
          <i data-lucide="calendar-clock" class="w-8 h-8"></i>
        </div>
        <h3 class="font-bold text-base text-slate-700 dark:text-slate-200">No hay gastos fijos en esta vista</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          ${state.fixedExpenses.length === 0 ? 'Estipula tus pagos fijos mensuales (arriendo, internet, agua, seguros, cuotas) para llevar un control estricto de abonos y saldos.' : 'No hay gastos con el filtro seleccionado.'}
        </p>
        ${state.fixedExpenses.length === 0 ? `
          <button onclick="openNewFixedExpenseModal()" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition">
            + Estipular Primer Gasto Fijo
          </button>
        ` : ''}
      </div>
    `;
    safeCreateIcons();
    return;
  }

  container.innerHTML = list.map(item => {
    const st = getFixedStatusForMonth(item, currentMonthKey);
    const meta = getCategoryMeta(item.category, 'expense');

    let badgeHTML = '';
    let barColor = 'bg-amber-500';

    if (st.status === 'completed') {
      badgeHTML = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
          Pagado Completo (${st.pct}%)
        </span>
      `;
      barColor = 'bg-emerald-500';
    } else if (st.status === 'partial') {
      badgeHTML = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <i data-lucide="pie-chart" class="w-3.5 h-3.5"></i>
          Abono Parcial (${st.pct}%)
        </span>
      `;
      barColor = 'bg-amber-500';
    } else {
      badgeHTML = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          <i data-lucide="clock" class="w-3.5 h-3.5"></i>
          Pendiente (0%)
        </span>
      `;
      barColor = 'bg-slate-300 dark:bg-slate-700';
    }

    // Historial de abonos de este mes
    let paymentsHistoryHTML = '';
    if (st.payments.length > 0) {
      paymentsHistoryHTML = `
        <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Abonos realizados este mes (${st.payments.length}):</span>
          </div>
          <div class="space-y-1">
            ${st.payments.map(p => `
              <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
                <div class="min-w-0 pr-1">
                  <div class="font-bold text-slate-800 dark:text-slate-200">
                    ${formatMoney(p.amount)} <span class="text-[10px] font-normal text-slate-400">(${p.type === 'parcial' ? 'Parcial' : 'Completo'})</span>
                  </div>
                  <div class="text-[10px] text-slate-400 flex items-center gap-1">
                    <i data-lucide="calendar" class="w-2.5 h-2.5 text-emerald-500"></i>
                    <span>${p.date}</span>
                    <span>•</span>
                    <span>${escapeHTML(p.paymentMethod || 'Transferencia')}</span>
                    ${p.notes ? `<span>• "${escapeHTML(p.notes)}"</span>` : ''}
                  </div>
                </div>
                <button onclick="deleteFixedPayment('${item.id}', '${p.id}')" title="Eliminar este abono y devolver al saldo pendiente" class="p-1 text-slate-400 hover:text-rose-600 transition">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    return `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 border ${st.status === 'completed' ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-slate-200 dark:border-slate-800'} shadow-xs flex flex-col justify-between space-y-4 transition">
        <div>
          <!-- Header Card: Icon, Title & Edit/Delete -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${st.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'}">
                <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">${escapeHTML(item.concept)}</h4>
                <span class="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                  <i data-lucide="calendar" class="w-3 h-3 text-emerald-500"></i>
                  Vence el día <strong>${item.dueDay}</strong> de cada mes
                </span>
              </div>
            </div>
            <div class="flex items-center">
              <button onclick="openEditFixedExpenseModal('${item.id}')" title="Modificar monto / datos" class="p-1.5 text-slate-400 hover:text-emerald-600 transition">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteFixedExpense('${item.id}')" title="Eliminar gasto fijo" class="p-1.5 text-slate-400 hover:text-rose-600 transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Monto y Estado de Liquidación -->
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div class="flex items-baseline justify-between">
              <span class="text-xs text-slate-400 uppercase font-semibold">Valor Total:</span>
              <span class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                ${formatMoney(st.total)}
              </span>
            </div>

            <!-- Barra de progreso del pago -->
            <div class="space-y-1">
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60 p-0.5">
                <div class="${barColor} h-full rounded-full transition-all duration-300" style="width: ${st.pct}%"></div>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Pagado: ${formatMoney(st.paid)}</span>
                <span class="${st.pending > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400'}">Resta: ${formatMoney(st.pending)}</span>
              </div>
            </div>

            <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span class="truncate">Categoría: <strong class="text-slate-700 dark:text-slate-300">${escapeHTML(item.category)}</strong></span>
              <span>${escapeHTML(item.paymentMethod || 'Transferencia')}</span>
            </div>

            ${item.notes ? `<p class="text-[11px] text-slate-400 italic truncate">Nota: ${escapeHTML(item.notes)}</p>` : ''}
          </div>

          <!-- Historial de Abonos -->
          ${paymentsHistoryHTML}
        </div>

        <!-- Acciones: Registrar Pago / Abono -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          ${badgeHTML}
          <button onclick="openFixedPaymentModal('${item.id}')" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
            <span>${st.status === 'completed' ? 'Abono Extra' : (st.status === 'partial' ? 'Abonar Saldo' : 'Registrar Pago')}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  safeCreateIcons();
}

// Modal para Registrar Pago (Completo o Parcial con fecha)
function openFixedPaymentModal(fixedId) {
  const fixed = state.fixedExpenses.find(f => f.id === fixedId);
  if (!fixed) return;

  const currentMonthKey = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}`;
  const st = getFixedStatusForMonth(fixed, currentMonthKey);

  // Asignación segura usando operador opcional (?.)
  const elTitle = document.getElementById('paymentModalTitle');
  if (elTitle) elTitle.textContent = `Registrar Pago: ${fixed.concept}`;

  const elSubtitle = document.getElementById('paymentModalSubtitle');
  if (elSubtitle) elSubtitle.textContent = `Categoría: ${fixed.category} • Vencimiento día ${fixed.dueDay}`;

  const elTotal = document.getElementById('modalFixedTotalAmount');
  if (elTotal) elTotal.textContent = formatMoney(st.total);

  const elPaid = document.getElementById('modalFixedPaidAmount');
  if (elPaid) elPaid.textContent = formatMoney(st.paid);

  const elPending = document.getElementById('modalFixedPendingAmount');
  if (elPending) elPending.textContent = formatMoney(st.pending);

  const inputId = document.getElementById('paymentFixedId');
  if (inputId) inputId.value = fixed.id;
  
  // Por defecto, monto sugerido es el saldo restante si queda saldo, o el total
  const defaultAmount = st.pending > 0 ? st.pending : st.total;
  const inputAmount = document.getElementById('paymentAmountInput');
  if (inputAmount) inputAmount.value = defaultAmount;

  // Fecha por defecto: hoy
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const inputDate = document.getElementById('paymentDateInput');
  if (inputDate) inputDate.value = `${yyyy}-${mm}-${dd}`;

  const selectMethod = document.getElementById('paymentMethodSelect');
  if (selectMethod) selectMethod.value = fixed.paymentMethod || 'Transferencia';

  const inputNotes = document.getElementById('paymentNotesInput');
  if (inputNotes) inputNotes.value = '';

  // Selector por defecto
  setPaymentTypeChoice(st.pending > 0 ? 'full' : 'partial');

  // Mostrar el modal
  const modal = document.getElementById('fixedPaymentModal');
  if (modal) {
    modal.classList.remove('hidden');
    if (inputAmount) inputAmount.focus();
  } else {
    console.error('El modal con id "fixedPaymentModal" no existe en tu HTML.');
  }
}

function setPaymentTypeChoice(choice) {
  const btnFull = document.getElementById('btnPayTypeFull');
  const btnPartial = document.getElementById('btnPayTypePartial');
  const typeInput = document.getElementById('paymentTypeChoice');

  typeInput.value = choice;
  if (choice === 'full') {
    btnFull.className = 'py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 bg-emerald-600 text-white shadow-sm transition';
    btnPartial.className = 'py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition';
  } else {
    btnPartial.className = 'py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 bg-amber-600 text-white shadow-sm transition';
    btnFull.className = 'py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition';
  }
}

function saveFixedPayment(e) {
  e.preventDefault();
  const fixedId = document.getElementById('paymentFixedId').value;
  const fixed = state.fixedExpenses.find(f => f.id === fixedId);
  if (!fixed) return;

  const choice = document.getElementById('paymentTypeChoice').value;
  const isPartial = choice === 'partial';
  const amount = parseFloat(document.getElementById('paymentAmountInput').value);
  const date = document.getElementById('paymentDateInput').value;
  const paymentMethod = document.getElementById('paymentMethodSelect').value;
  const notes = document.getElementById('paymentNotesInput').value.trim();

  if (!amount || amount <= 0 || !date) {
    showToast('Ingresa un monto válido mayor a 0 y una fecha de pago', 'error');
    return;
  }

  const currentMonthKey = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}`;
  if (!Array.isArray(fixed.payments)) fixed.payments = [];
  if (!Array.isArray(fixed.paidMonths)) fixed.paidMonths = [];

  const paymentId = 'pay-' + Date.now();
  const paymentObj = {
    id: paymentId,
    monthKey: currentMonthKey,
    type: isPartial ? 'parcial' : 'completo',
    amount: amount,
    date: date,
    paymentMethod: paymentMethod,
    notes: notes
  };

  fixed.payments.push(paymentObj);

  // Verificar si con este pago se liquidó el total para actualizar paidMonths
  const st = getFixedStatusForMonth(fixed, currentMonthKey);
  if (st.status === 'completed' && !fixed.paidMonths.includes(currentMonthKey)) {
    fixed.paidMonths.push(currentMonthKey);
  }

  // Registrar transacción real en el balance de gastos del mes con esa fecha exacta
  const txId = 'tx-pay-' + paymentId;
  state.transactions.push({
    id: txId,
    type: 'expense',
    amount: amount,
    category: fixed.category,
    concept: `[Fijo] ${fixed.concept} ${isPartial ? '(Abono Parcial)' : '(Pago Completo)'}`,
    date: date,
    paymentMethod: paymentMethod,
    notes: notes ? `Abono de gasto fijo: ${notes}` : 'Pago de gasto fijo mensual estipulado',
    fixedExpenseId: fixed.id,
    fixedPaymentId: paymentId,
    createdAt: Date.now()
  });

  saveState();
  document.getElementById('fixedPaymentModal').classList.add('hidden');
  renderApp();

  showToast(`Pago de ${formatMoney(amount)} registrado el día ${date} y sumado al balance mensual`, 'success');
}

function deleteFixedPayment(fixedId, paymentId) {
  const fixed = state.fixedExpenses.find(f => f.id === fixedId);
  if (!fixed) return;

  const payment = (fixed.payments || []).find(p => p.id === paymentId);
  const amountStr = payment ? formatMoney(payment.amount) : '';
  const dateStr = payment ? payment.date : '';

  if (confirm(`¿Estás seguro de eliminar este abono de ${amountStr} realizado el ${dateStr}? Se restará de los gastos del mes.`)) {
    fixed.payments = (fixed.payments || []).filter(p => p.id !== paymentId);

    // Retirar la transacción del balance
    state.transactions = state.transactions.filter(t => t.fixedPaymentId !== paymentId && t.id !== ('tx-pay-' + paymentId));

    // Recalcular estado de paidMonths
    const currentMonthKey = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}`;
    const st = getFixedStatusForMonth(fixed, currentMonthKey);
    if (st.status !== 'completed' && Array.isArray(fixed.paidMonths)) {
      fixed.paidMonths = fixed.paidMonths.filter(m => m !== currentMonthKey);
    }

    saveState();
    renderApp();
    showToast('Abono eliminado y balance actualizado', 'info');
  }
}

// Modales de Gasto Fijo (Crear / Modificar Definición de Obligación)
function openNewFixedExpenseModal() {
  document.getElementById('fixedExpenseModalTitle').textContent = 'Estipular Gasto Fijo';
  document.getElementById('fixedExpenseId').value = '';
  document.getElementById('fixedConcept').value = '';
  document.getElementById('fixedAmount').value = '';
  document.getElementById('fixedDueDay').value = '5';
  document.getElementById('fixedNotes').value = '';

  const select = document.getElementById('fixedCategory');
  select.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');

  document.getElementById('fixedExpenseModal').classList.remove('hidden');
  document.getElementById('fixedConcept').focus();
}

function openEditFixedExpenseModal(fixedId) {
  const fixed = state.fixedExpenses.find(f => f.id === fixedId);
  if (!fixed) return;

  document.getElementById('fixedExpenseModalTitle').textContent = 'Modificar Gasto Fijo';
  document.getElementById('fixedExpenseId').value = fixed.id;
  document.getElementById('fixedConcept').value = fixed.concept;
  document.getElementById('fixedAmount').value = fixed.amount;
  document.getElementById('fixedDueDay').value = fixed.dueDay;
  document.getElementById('fixedPaymentMethod').value = fixed.paymentMethod || 'Transferencia';
  document.getElementById('fixedNotes').value = fixed.notes || '';

  const select = document.getElementById('fixedCategory');
  select.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');
  select.value = fixed.category;

  document.getElementById('fixedExpenseModal').classList.remove('hidden');
}

function saveFixedExpense(e) {
  e.preventDefault();
  const id = document.getElementById('fixedExpenseId').value;
  const concept = document.getElementById('fixedConcept').value.trim();
  const amount = parseFloat(document.getElementById('fixedAmount').value);
  const dueDay = parseInt(document.getElementById('fixedDueDay').value, 10);
  const category = document.getElementById('fixedCategory').value;
  const paymentMethod = document.getElementById('fixedPaymentMethod').value;
  const notes = document.getElementById('fixedNotes').value.trim();

  if (!concept || isNaN(amount) || amount <= 0 || isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
    showToast('Por favor ingresa datos válidos para el gasto fijo', 'error');
    return;
  }

  if (id) {
    const idx = state.fixedExpenses.findIndex(f => f.id === id);
    if (idx !== -1) {
      state.fixedExpenses[idx] = {
        ...state.fixedExpenses[idx],
        concept,
        amount,
        dueDay,
        category,
        paymentMethod,
        notes
      };
      showToast('Gasto fijo modificado con éxito', 'success');
    }
  } else {
    state.fixedExpenses.push({
      id: 'fix-' + Date.now(),
      concept,
      amount,
      dueDay,
      category,
      paymentMethod,
      notes,
      paidMonths: [],
      payments: []
    });
    showToast('Nuevo gasto fijo estipulado correctamente', 'success');
  }

  saveState();
  document.getElementById('fixedExpenseModal').classList.add('hidden');
  renderApp();
}

function deleteFixedExpense(fixedId) {
  if (confirm('¿Estás seguro de que deseas eliminar este gasto fijo y todos sus abonos registrados?')) {
    // Eliminar transacciones asociadas en el balance
    state.transactions = state.transactions.filter(t => t.fixedExpenseId !== fixedId);
    state.fixedExpenses = state.fixedExpenses.filter(f => f.id !== fixedId);
    saveState();
    renderApp();
    showToast('Gasto fijo eliminado', 'info');
  }
}

// ================= GESTIÓN DE TRANSACCIONES (CRUD & MODAL) =================
function openNewTxModal(type = 'expense') {
  document.getElementById('txModalTitle').textContent = 'Nueva Transacción';
  document.getElementById('txId').value = '';
  document.getElementById('txAmount').value = '';
  document.getElementById('txConcept').value = '';
  document.getElementById('txNotes').value = '';
  
  const d = new Date();
  const currentDay = String(d.getDate()).padStart(2, '0');
  const m = String(state.selectedMonth + 1).padStart(2, '0');
  document.getElementById('txDate').value = `${state.selectedYear}-${m}-${currentDay}`;

  setTxModalType(type);
  document.getElementById('txModal').classList.remove('hidden');
  document.getElementById('txAmount').focus();
}

function openEditTxModal(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  document.getElementById('txModalTitle').textContent = 'Modificar Transacción';
  document.getElementById('txId').value = tx.id;
  document.getElementById('txAmount').value = tx.amount;
  document.getElementById('txConcept').value = tx.concept;
  document.getElementById('txDate').value = tx.date;
  document.getElementById('txPaymentMethod').value = tx.paymentMethod || 'Tarjeta';
  document.getElementById('txNotes').value = tx.notes || '';

  setTxModalType(tx.type);
  document.getElementById('txCategory').value = tx.category;

  document.getElementById('txModal').classList.remove('hidden');
}

function setTxModalType(type) {
  const btnExp = document.getElementById('txTypeExpense');
  const btnInc = document.getElementById('txTypeIncome');
  const select = document.getElementById('txCategory');

  if (type === 'income') {
    btnInc.className = 'py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-emerald-600 text-white shadow-sm transition';
    btnExp.className = 'py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition';
    select.innerHTML = INCOME_CATEGORIES.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');
  } else {
    btnExp.className = 'py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-rose-600 text-white shadow-sm transition';
    btnInc.className = 'py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition';
    select.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');
  }
}

function saveTransaction(e) {
  e.preventDefault();
  const txId = document.getElementById('txId').value;
  const isIncome = document.getElementById('txTypeIncome').classList.contains('bg-emerald-600');
  const type = isIncome ? 'income' : 'expense';
  const amount = parseFloat(document.getElementById('txAmount').value);
  const category = document.getElementById('txCategory').value;
  const concept = document.getElementById('txConcept').value.trim();
  const date = document.getElementById('txDate').value;
  const paymentMethod = document.getElementById('txPaymentMethod').value;
  const notes = document.getElementById('txNotes').value.trim();

  if (!amount || amount <= 0 || !concept || !date) {
    showToast('Por favor completa todos los campos requeridos con valores válidos', 'error');
    return;
  }

  if (txId) {
    const idx = state.transactions.findIndex(t => t.id === txId);
    if (idx !== -1) {
      state.transactions[idx] = {
        ...state.transactions[idx],
        type,
        amount,
        category,
        concept,
        date,
        paymentMethod,
        notes,
        updatedAt: Date.now()
      };
      showToast('Transacción y monto modificados con éxito', 'success');
    }
  } else {
    const newTx = {
      id: 'tx-' + Date.now(),
      type,
      amount,
      category,
      concept,
      date,
      paymentMethod,
      notes,
      createdAt: Date.now()
    };
    state.transactions.push(newTx);
    showToast('Transacción registrada con éxito', 'success');
  }

  const txDateObj = new Date(date + 'T00:00:00');
  state.selectedYear = txDateObj.getFullYear();
  state.selectedMonth = txDateObj.getMonth();

  saveState();
  document.getElementById('txModal').classList.add('hidden');
  renderApp();
}

function deleteTransaction(txId) {
  if (confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
    state.transactions = state.transactions.filter(t => t.id !== txId);
    saveState();
    renderApp();
    showToast('Transacción eliminada', 'info');
  }
}

function applyTransactionFilters() {
  const container = document.getElementById('fullTxList');
  if (!container) return;

  const currentMonthTransactions = getTransactionsForCurrentMonth();

  // Actualizar contador en sidebar desktop
  const badgeTxCount = document.getElementById('badgeTxCount');
  if (badgeTxCount) {
    badgeTxCount.textContent = currentMonthTransactions.length;
  }

  const searchInput = document.getElementById('txSearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const catSelect = document.getElementById('txCategoryFilter');
  const selectedCat = catSelect ? catSelect.value : 'all';

  const activeTypeBtn = document.querySelector('.tx-type-filter.active');
  const selectedType = activeTypeBtn ? activeTypeBtn.getAttribute('data-filter-type') : 'all';

  let filtered = currentMonthTransactions.filter(tx => {
    if (selectedType !== 'all' && tx.type !== selectedType) return false;
    if (selectedCat !== 'all' && tx.category !== selectedCat) return false;
    if (query) {
      const inConcept = (tx.concept || '').toLowerCase().includes(query);
      const inNotes = (tx.notes || '').toLowerCase().includes(query);
      const inCat = (tx.category || '').toLowerCase().includes(query);
      const inMethod = (tx.paymentMethod || '').toLowerCase().includes(query);
      const inAmount = String(tx.amount || '').includes(query);
      if (!inConcept && !inNotes && !inCat && !inMethod && !inAmount) return false;
    }
    return true;
  });

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const countLabel = document.getElementById('txFilteredCount');
  if (countLabel) {
    countLabel.textContent = `${filtered.length} transacción${filtered.length === 1 ? '' : 'es'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center text-slate-400">
        <div class="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <i data-lucide="receipt" class="w-8 h-8 opacity-60"></i>
        </div>
        <h3 class="font-bold text-base text-slate-700 dark:text-slate-200">No hay movimientos registrados</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          ${currentMonthTransactions.length === 0 ? `No tienes transacciones registradas en ${MONTH_NAMES[state.selectedMonth]} de ${state.selectedYear}.` : 'No se encontraron resultados con los filtros actuales.'}
        </p>
        <button onclick="openNewTxModal('expense')" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition">
          + Nueva Transacción
        </button>
      </div>
    `;
    safeCreateIcons();
    return;
  }

  container.innerHTML = filtered.map(tx => {
    const isInc = tx.type === 'income';
    const meta = getCategoryMeta(tx.category, tx.type);

    return `
      <div class="p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3 group">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isInc ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'}">
            <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">${escapeHTML(tx.concept)}</h4>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${isInc ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}">
                ${escapeHTML(tx.category)}
              </span>
            </div>
            <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span class="flex items-center gap-1">
                <i data-lucide="calendar" class="w-3 h-3 text-emerald-500"></i>
                ${tx.date}
              </span>
              <span>•</span>
              <span>${escapeHTML(tx.paymentMethod || 'Efectivo')}</span>
              ${tx.notes ? `<span class="hidden sm:inline italic text-slate-400 truncate">• "${escapeHTML(tx.notes)}"</span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <div class="font-black text-xs sm:text-base ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}">
              ${isInc ? '+' : '-'}${formatMoney(tx.amount)}
            </div>
            <div class="text-[10px] font-medium ${isInc ? 'text-emerald-500' : 'text-slate-400'}">
              ${isInc ? 'Ingreso' : 'Gasto'}
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="openEditTxModal('${tx.id}')" title="Modificar transacción" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteTransaction('${tx.id}')" title="Eliminar transacción" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  safeCreateIcons();
}

function renderTransactions() {
  const select = document.getElementById('txCategoryFilter');
  if (select) {
    const currentVal = select.value || 'all';
    const allCategories = new Set();
    EXPENSE_CATEGORIES.forEach(c => allCategories.add(c.name));
    INCOME_CATEGORIES.forEach(c => allCategories.add(c.name));

    let html = '<option value="all">Todas las categorías</option>';
    allCategories.forEach(cat => {
      html += `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;
    });
    select.innerHTML = html;
    select.value = currentVal;
  }

  applyTransactionFilters();
}

// ================= GESTIÓN DE METAS DE AHORRO =================
function openNewGoalModal() {
  document.getElementById('goalModalTitle').textContent = 'Nueva Meta de Ahorro';
  document.getElementById('goalId').value = '';
  document.getElementById('goalTitle').value = '';
  document.getElementById('goalTargetAmount').value = '';
  document.getElementById('goalCurrentAmount').value = '0';
  document.getElementById('goalDeadline').value = '';
  document.getElementById('goalColor').value = 'emerald';

  document.getElementById('goalModal').classList.remove('hidden');
  document.getElementById('goalTitle').focus();
}

function openEditGoalModal(goalId) {
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;

  document.getElementById('goalModalTitle').textContent = 'Modificar Meta de Ahorro';
  document.getElementById('goalId').value = goal.id;
  document.getElementById('goalTitle').value = goal.title;
  document.getElementById('goalTargetAmount').value = goal.targetAmount;
  document.getElementById('goalCurrentAmount').value = goal.currentAmount;
  document.getElementById('goalDeadline').value = goal.deadline || '';
  document.getElementById('goalColor').value = goal.color || 'emerald';

  document.getElementById('goalModal').classList.remove('hidden');
}

function saveGoal(e) {
  e.preventDefault();
  const goalId = document.getElementById('goalId').value;
  const title = document.getElementById('goalTitle').value.trim();
  const targetAmount = parseFloat(document.getElementById('goalTargetAmount').value);
  const currentAmount = parseFloat(document.getElementById('goalCurrentAmount').value) || 0;
  const deadline = document.getElementById('goalDeadline').value;
  const color = document.getElementById('goalColor').value;

  if (!title || !targetAmount || targetAmount <= 0) {
    showToast('Ingresa un título y un monto objetivo válido', 'error');
    return;
  }

  if (goalId) {
    const idx = state.goals.findIndex(g => g.id === goalId);
    if (idx !== -1) {
      state.goals[idx] = {
        ...state.goals[idx],
        title,
        targetAmount,
        currentAmount,
        deadline,
        color
      };
      showToast('Meta de ahorro modificada', 'success');
    }
  } else {
    state.goals.push({
      id: 'goal-' + Date.now(),
      title,
      targetAmount,
      currentAmount,
      deadline,
      color
    });
    showToast('Nueva meta creada con éxito', 'success');
  }

  saveState();
  document.getElementById('goalModal').classList.add('hidden');
  renderApp();
}

function deleteGoal(goalId) {
  if (confirm('¿Deseas eliminar esta meta de ahorro?')) {
    state.goals = state.goals.filter(g => g.id !== goalId);
    saveState();
    renderApp();
    showToast('Meta de ahorro eliminada', 'info');
  }
}

function openGoalFundModal(goalId, initialAction = 'deposit') {
  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;

  document.getElementById('fundGoalId').value = goal.id;
  document.getElementById('goalFundSubtitle').textContent = `Meta: ${goal.title} (${formatMoney(goal.currentAmount)} de ${formatMoney(goal.targetAmount)})`;
  document.getElementById('fundAmount').value = '';

  setFundAction(initialAction);
  document.getElementById('goalFundModal').classList.remove('hidden');
  document.getElementById('fundAmount').focus();
}

function setFundAction(action) {
  const btnDep = document.getElementById('btnFundActionDeposit');
  const btnWth = document.getElementById('btnFundActionWithdraw');
  const inputAction = document.getElementById('fundActionType');
  const btnConfirm = document.getElementById('btnConfirmFund');
  const modalTitle = document.getElementById('goalFundModalTitle');

  inputAction.value = action;
  if (action === 'deposit') {
    btnDep.className = 'py-2 rounded-lg font-bold text-xs bg-emerald-600 text-white shadow-sm transition';
    btnWth.className = 'py-2 rounded-lg font-bold text-xs text-slate-600 dark:text-slate-300 hover:text-rose-600 transition';
    btnConfirm.className = 'px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition';
    btnConfirm.textContent = 'Confirmar Abono';
    modalTitle.textContent = 'Abonar a la Meta';
  } else {
    btnWth.className = 'py-2 rounded-lg font-bold text-xs bg-rose-600 text-white shadow-sm transition';
    btnDep.className = 'py-2 rounded-lg font-bold text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition';
    btnConfirm.className = 'px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition';
    btnConfirm.textContent = 'Confirmar Retiro';
    modalTitle.textContent = 'Retirar de la Meta';
  }
}

function processGoalFund(e) {
  e.preventDefault();
  const goalId = document.getElementById('fundGoalId').value;
  const action = document.getElementById('fundActionType').value;
  const amount = parseFloat(document.getElementById('fundAmount').value);

  if (!amount || amount <= 0) {
    showToast('Ingresa un monto válido mayor a 0', 'error');
    return;
  }

  const goal = state.goals.find(g => g.id === goalId);
  if (!goal) return;

  if (action === 'deposit') {
    goal.currentAmount = (Number(goal.currentAmount) || 0) + amount;
    showToast(`¡Has abonado ${formatMoney(amount)} a "${goal.title}"!`, 'success');
    
    if (goal.currentAmount >= goal.targetAmount) {
      triggerConfetti();
      showToast(`🎉 ¡FELICIDADES! ¡Has alcanzado tu meta de ${goal.title}!`, 'success');
    }
  } else {
    if (amount > goal.currentAmount) {
      showToast('No puedes retirar más de lo ahorrado actualmente', 'error');
      return;
    }
    goal.currentAmount -= amount;
    showToast(`Has retirado ${formatMoney(amount)} de "${goal.title}"`, 'info');
  }

  saveState();
  document.getElementById('goalFundModal').classList.add('hidden');
  renderApp();
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function renderGoals() {
  const container = document.getElementById('goalsListGrid');
  if (!container) return;

  const totalAccumulated = state.goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
  const totalAccumulatedEl = document.getElementById('goalsTotalAccumulated');
  if (totalAccumulatedEl) {
    totalAccumulatedEl.textContent = formatMoney(totalAccumulated);
  }

  // Actualizar badge en sidebar desktop
  const badgeGoals = document.getElementById('badgeGoalsCount');
  if (badgeGoals) {
    badgeGoals.textContent = state.goals.length;
  }

  if (state.goals.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <div class="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 mx-auto flex items-center justify-center mb-3">
          <i data-lucide="target" class="w-8 h-8"></i>
        </div>
        <h3 class="font-bold text-base text-slate-700 dark:text-slate-200">No tienes metas de ahorro registradas</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Crea metas de ahorro para vacaciones, fondo de emergencia, vehículos o inversiones y sigue tu progreso paso a paso.
        </p>
        <button onclick="openNewGoalModal()" class="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition">
          + Crear Primera Meta
        </button>
      </div>
    `;
    safeCreateIcons();
    return;
  }

  container.innerHTML = state.goals.map(goal => {
    const current = Number(goal.currentAmount) || 0;
    const target = Number(goal.targetAmount) || 1;
    const pct = Math.min(100, Math.round((current / target) * 100));
    const remaining = Math.max(0, target - current);
    const isCompleted = current >= target;

    const colorMap = {
      emerald: { bar: 'bg-emerald-500', iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/60' },
      blue: { bar: 'bg-blue-500', iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/60' },
      purple: { bar: 'bg-purple-500', iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/60' },
      amber: { bar: 'bg-amber-500', iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/60' },
      rose: { bar: 'bg-rose-500', iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/60' }
    };
    const cTheme = colorMap[goal.color] || colorMap.emerald;

    return `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 border ${isCompleted ? 'border-emerald-300 dark:border-emerald-800 shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-800'} shadow-xs flex flex-col justify-between space-y-4 transition">
        <div>
          <!-- Header: Icon, Title & Edit/Delete -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${cTheme.iconBg}">
                <i data-lucide="${isCompleted ? 'check-circle-2' : 'target'}" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${escapeHTML(goal.title)}</h4>
                <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  ${goal.deadline ? `<span>Plazo: ${goal.deadline}</span>` : '<span>Sin fecha límite</span>'}
                </div>
              </div>
            </div>
            <div class="flex items-center">
              <button onclick="openEditGoalModal('${goal.id}')" title="Modificar meta" class="p-1.5 text-slate-400 hover:text-emerald-600 transition">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteGoal('${goal.id}')" title="Eliminar meta" class="p-1.5 text-slate-400 hover:text-rose-600 transition">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Montos y Progreso -->
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div class="flex items-baseline justify-between">
              <span class="text-xs text-slate-400 font-semibold uppercase">Ahorrado:</span>
              <span class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">${formatMoney(current)}</span>
            </div>

            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/60">
              <div class="${cTheme.bar} h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
            </div>

            <div class="flex items-center justify-between text-xs">
              <span class="font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}">
                ${isCompleted ? '🎉 ¡Meta cumplida!' : `${pct}% acumulado`}
              </span>
              <span class="text-slate-400">Objetivo: <strong class="text-slate-700 dark:text-slate-300">${formatMoney(target)}</strong></span>
            </div>

            ${!isCompleted ? `
              <div class="text-[11px] text-amber-600 dark:text-amber-400 font-medium text-right pt-0.5">
                Faltan ${formatMoney(remaining)} por ahorrar
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Botones de Acción: Abonar / Retirar -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
          <button onclick="openGoalFundModal('${goal.id}', 'deposit')" class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
            <span>Abonar</span>
          </button>
          <button onclick="openGoalFundModal('${goal.id}', 'withdraw')" class="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-95">
            <i data-lucide="minus-circle" class="w-3.5 h-3.5"></i>
            <span>Retirar</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  safeCreateIcons();
}

// ================= GESTIÓN DE LÍMITES DE GASTOS =================
function openEditGlobalLimitModal() {
  document.getElementById('inputGlobalLimitAmount').value = state.budgets.globalLimit || 0;
  document.getElementById('globalLimitModal').classList.remove('hidden');
  document.getElementById('inputGlobalLimitAmount').focus();
}

function saveGlobalLimit(e) {
  e.preventDefault();
  const newLimit = parseFloat(document.getElementById('inputGlobalLimitAmount').value);
  if (isNaN(newLimit) || newLimit < 0) {
    showToast('Ingresa un monto válido', 'error');
    return;
  }

  state.budgets.globalLimit = newLimit;
  saveState();
  document.getElementById('globalLimitModal').classList.add('hidden');
  renderApp();
  showToast('Límite global de gastos actualizado', 'success');
}

function openCategoryBudgetModal(categoryName = '', initialLimit = '') {
  const select = document.getElementById('budgetCategorySelect');
  select.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');

  if (categoryName) {
    select.value = categoryName;
    document.getElementById('categoryBudgetModalTitle').textContent = 'Modificar Límite de Categoría';
    document.getElementById('budgetCategoryAmount').value = initialLimit;
  } else {
    document.getElementById('categoryBudgetModalTitle').textContent = 'Asignar Límite por Categoría';
    document.getElementById('budgetCategoryAmount').value = '';
  }

  document.getElementById('categoryBudgetModal').classList.remove('hidden');
  document.getElementById('budgetCategoryAmount').focus();
}

function openEditCategoryBudgetModal(catName, limit) {
  openCategoryBudgetModal(catName, limit);
}

function saveCategoryBudget(e) {
  e.preventDefault();
  const category = document.getElementById('budgetCategorySelect').value;
  const amount = parseFloat(document.getElementById('budgetCategoryAmount').value);

  if (!amount || amount <= 0) {
    showToast('Ingresa un límite válido mayor a 0', 'error');
    return;
  }

  if (!state.budgets.categoryLimits) state.budgets.categoryLimits = {};
  state.budgets.categoryLimits[category] = amount;

  saveState();
  document.getElementById('categoryBudgetModal').classList.add('hidden');
  renderApp();
  showToast(`Límite para "${category}" actualizado a ${formatMoney(amount)}`, 'success');
}

function deleteCategoryBudget(categoryName) {
  if (confirm(`¿Deseas eliminar el límite asignado a "${categoryName}"?`)) {
    if (state.budgets.categoryLimits) {
      delete state.budgets.categoryLimits[categoryName];
    }
    saveState();
    renderApp();
    showToast('Límite de categoría eliminado', 'info');
  }
}

function renderBudgets() {
  const currentMonthTransactions = getTransactionsForCurrentMonth();
  let totalExpense = 0;
  const categoryExpenses = {};

  currentMonthTransactions.forEach(tx => {
    if (tx.type === 'expense') {
      const val = Number(tx.amount) || 0;
      totalExpense += val;
      categoryExpenses[tx.category] = (categoryExpenses[tx.category] || 0) + val;
    }
  });

  // 1. Límite Global Mensual
  const globalLimit = state.budgets.globalLimit || 0;
  const remaining = globalLimit - totalExpense;
  const consumedPct = globalLimit > 0 ? (totalExpense / globalLimit) * 100 : 0;

  const spentEl = document.getElementById('budgetSpentAmount');
  if (spentEl) spentEl.textContent = formatMoney(totalExpense);

  const limitEl = document.getElementById('budgetGlobalLimitAmount');
  if (limitEl) limitEl.textContent = formatMoney(globalLimit);

  const progressBar = document.getElementById('budgetGlobalProgressBar');
  if (progressBar) {
    progressBar.style.width = `${Math.min(100, Math.max(0, consumedPct))}%`;
    if (consumedPct >= 100) {
      progressBar.className = 'h-full rounded-full bg-rose-500 transition-all duration-500';
    } else if (consumedPct >= 80) {
      progressBar.className = 'h-full rounded-full bg-amber-500 transition-all duration-500';
    } else {
      progressBar.className = 'h-full rounded-full bg-emerald-500 transition-all duration-500';
    }
  }

  const remEl = document.getElementById('budgetGlobalRemainingText');
  if (remEl) {
    if (remaining >= 0) {
      remEl.textContent = `Disponible: ${formatMoney(remaining)}`;
      remEl.className = 'text-slate-500 dark:text-slate-400';
    } else {
      remEl.textContent = `Excedido por ${formatMoney(Math.abs(remaining))}`;
      remEl.className = 'text-rose-600 dark:text-rose-400 font-semibold';
    }
  }

  const badgeEl = document.getElementById('budgetGlobalPercentBadge');
  if (badgeEl) {
    badgeEl.textContent = `${consumedPct.toFixed(0)}% consumido`;
    if (consumedPct >= 100) {
      badgeEl.className = 'font-bold text-rose-600 dark:text-rose-400';
    } else if (consumedPct >= 80) {
      badgeEl.className = 'font-bold text-amber-600 dark:text-amber-400';
    } else {
      badgeEl.className = 'font-semibold text-emerald-600 dark:text-emerald-400';
    }
  }

  // 2. Límites por Categoría
  const container = document.getElementById('categoryBudgetsGrid');
  if (!container) return;

  const categoryLimits = state.budgets.categoryLimits || {};
  const entries = Object.entries(categoryLimits);

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2">
          <i data-lucide="shield-alert" class="w-7 h-7"></i>
        </div>
        <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200">No has asignado límites por categoría</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Controla rubros específicos como Alimentación, Vivienda, Transporte u Ocio.</p>
        <button onclick="openCategoryBudgetModal()" class="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition">
          + Asignar Primer Límite
        </button>
      </div>
    `;
    safeCreateIcons();
    return;
  }

  container.innerHTML = entries.map(([catName, catLimit]) => {
    const spent = categoryExpenses[catName] || 0;
    const limit = Number(catLimit) || 0;
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    const diff = limit - spent;
    const meta = getCategoryMeta(catName, 'expense');

    let barColor = 'bg-emerald-500';
    let statusText = `Disponible: ${formatMoney(diff)}`;
    let statusClass = 'text-slate-500 dark:text-slate-400';

    if (spent > limit) {
      barColor = 'bg-rose-500';
      statusText = `Excedido por ${formatMoney(spent - limit)}`;
      statusClass = 'text-rose-600 dark:text-rose-400 font-bold';
    } else if (pct >= 85) {
      barColor = 'bg-amber-500';
      statusClass = 'text-amber-600 dark:text-amber-400 font-medium';
    }

    return `
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-5 border ${spent > limit ? 'border-rose-200 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-800'} shadow-xs flex flex-col justify-between space-y-3 transition">
        <div>
          <!-- Header -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <i data-lucide="${meta.icon}" class="w-4 h-4"></i>
              </div>
              <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">${escapeHTML(catName)}</h4>
            </div>
            <div class="flex items-center">
              <button onclick="openEditCategoryBudgetModal('${escapeHTML(catName)}', ${limit})" title="Modificar límite" class="p-1 text-slate-400 hover:text-emerald-600 transition">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="deleteCategoryBudget('${escapeHTML(catName)}')" title="Eliminar límite" class="p-1 text-slate-400 hover:text-rose-600 transition">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Montos -->
          <div class="mt-3 space-y-1.5">
            <div class="flex items-baseline justify-between text-xs">
              <span class="text-slate-400">Gastado: <strong class="text-slate-800 dark:text-slate-200">${formatMoney(spent)}</strong></span>
              <span class="text-slate-400">Límite: <strong class="text-slate-800 dark:text-slate-200">${formatMoney(limit)}</strong></span>
            </div>

            <!-- Barra -->
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/60">
              <div class="${barColor} h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, pct)}%"></div>
            </div>

            <div class="flex items-center justify-between text-[11px] pt-0.5">
              <span class="${statusClass}">${statusText}</span>
              <span class="font-bold ${pct >= 100 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}">${pct.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  safeCreateIcons();
}

// ================= MODAL CÓDIGO QR & CONECTIVIDAD ANDROID =================
async function openMobileConnectModal() {
  const modal = document.getElementById('mobileConnectModal');
  const urlDisplay = document.getElementById('mobileConnectUrl');
  const qrContainer = document.getElementById('qrcodeContainer');

  qrContainer.innerHTML = '';

  let targetUrl = window.location.href;

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    try {
      const res = await fetch('./api/info');
      if (res.ok) {
        const info = await res.json();
        if (info.lanUrl) {
          targetUrl = info.lanUrl;
        }
      }
    } catch (e) {
      // Fallback a url actual
    }
  }

  urlDisplay.textContent = targetUrl;

  if (typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: targetUrl,
      width: 170,
      height: 170,
      colorDark: "#064e3b",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrContainer.innerHTML = `<p class="text-xs text-slate-500">Escanea la dirección:<br><strong>${targetUrl}</strong></p>`;
  }

  modal.classList.remove('hidden');
}

// Descargar archivo autónomo FinanzasPro_Movil.html
function downloadStandaloneMobileHtml() {
  try {
    // Si podemos descargar el archivo ya generado del servidor
    const a = document.createElement('a');
    a.href = './FinanzasPro_Movil.html';
    a.download = 'FinanzasPro_Movil.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Descargando FinanzasPro_Movil.html para tu celular', 'success');
  } catch (e) {
    showToast('Archivo listo en la carpeta de la aplicación', 'info');
  }
}

// ================= EXPORTACIÓN & IMPORTACIÓN DE DATOS =================
function exportDataJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `FinanzasPro_Respaldo_${new Date().toISOString().slice(0, 10)}.json`);
  dlAnchor.click();
  showToast('Respaldo JSON descargado correctamente', 'success');
}

function exportDataCSV() {
  const currentMonthTransactions = getTransactionsForCurrentMonth();
  if (!currentMonthTransactions.length) {
    showToast('No hay transacciones para exportar en este mes', 'info');
    return;
  }

  let csv = "Fecha,Tipo,Categoría,Concepto,Monto,Método de Pago,Notas\r\n";
  currentMonthTransactions.forEach(t => {
    const row = [
      `"${t.date}"`,
      `"${t.type === 'income' ? 'Ingreso' : 'Gasto'}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.concept.replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ];
    csv += row.join(",") + "\r\n";
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", url);
  dlAnchor.setAttribute("download", `FinanzasPro_${MONTH_NAMES[state.selectedMonth]}_${state.selectedYear}.csv`);
  dlAnchor.click();
  showToast('Reporte CSV para Microsoft Excel descargado', 'success');
}

function importDataJSON(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported.transactions)) {
        state = { ...state, ...imported };
        if (!Array.isArray(state.fixedExpenses)) state.fixedExpenses = [];
        saveState();
        renderApp();
        showToast('Respaldo restaurado con éxito', 'success');
      } else {
        showToast('El archivo JSON no contiene un formato válido de FinanzasPro', 'error');
      }
    } catch (err) {
      showToast('Error al leer el archivo JSON', 'error');
    }
  };
  reader.readAsText(file);
}

// ================= SELECTOR DE MES Y AÑO =================
function openMonthPicker() {
  const grid = document.getElementById('pickerMonthGrid');
  grid.innerHTML = MONTH_NAMES.map((m, idx) => {
    const isSelected = idx === state.selectedMonth;
    return `
      <button onclick="selectMonth(${idx})" class="p-2.5 rounded-xl text-xs font-semibold ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700'} transition">
        ${m}
      </button>
    `;
  }).join('');
  document.getElementById('pickerYearLabel').textContent = state.selectedYear;
  document.getElementById('monthPickerModal').classList.remove('hidden');
}

function selectMonth(monthIndex) {
  state.selectedMonth = monthIndex;
  document.getElementById('monthPickerModal').classList.add('hidden');
  renderApp();
}

function changeMonth(delta) {
  let m = state.selectedMonth + delta;
  let y = state.selectedYear;
  if (m < 0) {
    m = 11;
    y--;
  } else if (m > 11) {
    m = 0;
    y++;
  }
  state.selectedMonth = m;
  state.selectedYear = y;
  renderApp();
}

function getTransactionsForCurrentMonth() {
  const targetYear = state.selectedYear;
  const targetMonth = state.selectedMonth;

  return state.transactions.filter(t => {
    if (!t.date) return false;
    const parts = t.date.split('-');
    if (parts.length < 2) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    return year === targetYear && month === targetMonth;
  });
}

// ================= TOAST NOTIFICACIONES =================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  
  let bg = 'bg-slate-900 text-white';
  let icon = 'info';
  if (type === 'success') {
    bg = 'bg-emerald-600 text-white';
    icon = 'check-circle';
  } else if (type === 'error') {
    bg = 'bg-rose-600 text-white';
    icon = 'alert-circle';
  }

  toast.className = `${bg} px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i>
    <span>${escapeHTML(message)}</span>
  `;

  container.appendChild(toast);
  safeCreateIcons();

  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ================= EVENT LISTENERS =================
function setupEventListeners() {
  // Navegación por pestañas (Desktop & Mobile)
  const tabButtons = document.querySelectorAll('.nav-tab-btn, .mobile-nav-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.remove('hidden');

      document.querySelectorAll('.nav-tab-btn, .mobile-nav-btn').forEach(b => {
        b.classList.remove('active', 'text-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-950/40');
      });

      document.querySelectorAll(`[data-tab="${targetTab}"]`).forEach(b => {
        b.classList.add('active');
        if (b.classList.contains('nav-tab-btn')) {
          b.classList.add('bg-emerald-50', 'dark:bg-emerald-950/40', 'text-emerald-700', 'dark:text-emerald-300');
        } else {
          b.classList.add('text-emerald-600');
        }
      });

      safeCreateIcons();
    });
  });

  // Navegación de Mes
  document.getElementById('btnPrevMonth').addEventListener('click', () => changeMonth(-1));
  document.getElementById('btnNextMonth').addEventListener('click', () => changeMonth(1));
  document.getElementById('monthSelectorTrigger').addEventListener('click', openMonthPicker);
  document.getElementById('btnCloseMonthPicker').addEventListener('click', () => {
    document.getElementById('monthPickerModal').classList.add('hidden');
  });
  document.getElementById('btnPrevYear').addEventListener('click', () => {
    state.selectedYear--;
    renderMonthHeader();
  });
  document.getElementById('btnNextYear').addEventListener('click', () => {
    state.selectedYear++;
    renderMonthHeader();
  });

  // Atajos desde Dashboard
  document.getElementById('btnViewAllTx').addEventListener('click', () => {
    document.querySelector('.nav-tab-btn[data-tab="tab-transactions"]').click();
  });
  document.getElementById('btnViewAllGoals').addEventListener('click', () => {
    document.querySelector('.nav-tab-btn[data-tab="tab-goals"]').click();
  });
  const btnViewAllFixed = document.getElementById('btnViewAllFixed');
  if (btnViewAllFixed) {
    btnViewAllFixed.addEventListener('click', () => {
      const targetBtn = document.querySelector('.nav-tab-btn[data-tab="tab-fixed-expenses"]') || document.querySelector('.mobile-nav-btn[data-tab="tab-fixed-expenses"]');
      if (targetBtn) targetBtn.click();
    });
  }

  // Modales Transacción
  document.getElementById('btnOpenNewTxModal').addEventListener('click', () => openNewTxModal('expense'));
  document.getElementById('btnOpenNewTxFromTab').addEventListener('click', () => openNewTxModal('expense'));
  document.getElementById('btnMobileFAB').addEventListener('click', () => openNewTxModal('expense'));
  document.getElementById('btnCloseTxModal').addEventListener('click', () => document.getElementById('txModal').classList.add('hidden'));
  document.getElementById('btnCancelTx').addEventListener('click', () => document.getElementById('txModal').classList.add('hidden'));
  document.getElementById('txForm').addEventListener('submit', saveTransaction);
  document.getElementById('txTypeExpense').addEventListener('click', () => setTxModalType('expense'));
  document.getElementById('txTypeIncome').addEventListener('click', () => setTxModalType('income'));

  // Modales Gastos Fijos (Definición)
  const btnOpenNewFixed = document.getElementById('btnOpenNewFixedExpenseModal');
  if (btnOpenNewFixed) btnOpenNewFixed.addEventListener('click', openNewFixedExpenseModal);
  const btnCloseFixedModal = document.getElementById('btnCloseFixedExpenseModal');
  if (btnCloseFixedModal) btnCloseFixedModal.addEventListener('click', () => document.getElementById('fixedExpenseModal').classList.add('hidden'));
  const btnCancelFixed = document.getElementById('btnCancelFixedExpense');
  if (btnCancelFixed) btnCancelFixed.addEventListener('click', () => document.getElementById('fixedExpenseModal').classList.add('hidden'));
  const fixedForm = document.getElementById('fixedExpenseForm');
  if (fixedForm) fixedForm.addEventListener('submit', saveFixedExpense);

  // Filtros de Gastos Fijos
  document.querySelectorAll('.fixed-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fixed-filter-btn').forEach(b => b.classList.remove('active', 'bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-xs'));
      btn.classList.add('active', 'bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-xs');
      currentFixedFilter = btn.getAttribute('data-filter-fixed');
      renderFixedExpenses();
    });
  });

  // Modal de Pago / Abono de Gasto Fijo
  const btnClosePaymentModal = document.getElementById('btnCloseFixedPaymentModal');
  if (btnClosePaymentModal) btnClosePaymentModal.addEventListener('click', () => document.getElementById('fixedPaymentModal').classList.add('hidden'));
  const btnCancelPayment = document.getElementById('btnCancelFixedPayment');
  if (btnCancelPayment) btnCancelPayment.addEventListener('click', () => document.getElementById('fixedPaymentModal').classList.add('hidden'));
  const paymentForm = document.getElementById('fixedPaymentForm');
  if (paymentForm) paymentForm.addEventListener('submit', saveFixedPayment);

  const btnPayTypeFull = document.getElementById('btnPayTypeFull');
  if (btnPayTypeFull) {
    btnPayTypeFull.addEventListener('click', () => {
      setPaymentTypeChoice('full');
      // Autocompletar con saldo pendiente
      const fixedId = document.getElementById('paymentFixedId').value;
      const fixed = state.fixedExpenses.find(f => f.id === fixedId);
      if (fixed) {
        const currentMonthKey = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}`;
        const st = getFixedStatusForMonth(fixed, currentMonthKey);
        document.getElementById('paymentAmountInput').value = st.pending > 0 ? st.pending : st.total;
      }
    });
  }

  const btnPayTypePartial = document.getElementById('btnPayTypePartial');
  if (btnPayTypePartial) {
    btnPayTypePartial.addEventListener('click', () => {
      setPaymentTypeChoice('partial');
    });
  }

  const btnPayQuickAll = document.getElementById('btnPayQuickAllPending');
  if (btnPayQuickAll) {
    btnPayQuickAll.addEventListener('click', () => {
      const fixedId = document.getElementById('paymentFixedId').value;
      const fixed = state.fixedExpenses.find(f => f.id === fixedId);
      if (fixed) {
        const currentMonthKey = `${state.selectedYear}-${String(state.selectedMonth + 1).padStart(2, '0')}`;
        const st = getFixedStatusForMonth(fixed, currentMonthKey);
        document.getElementById('paymentAmountInput').value = st.pending > 0 ? st.pending : st.total;
        setPaymentTypeChoice('full');
      }
    });
  }

  // Modales Metas
  document.getElementById('btnOpenNewGoalModal').addEventListener('click', openNewGoalModal);
  document.getElementById('btnCloseGoalModal').addEventListener('click', () => document.getElementById('goalModal').classList.add('hidden'));
  document.getElementById('btnCancelGoal').addEventListener('click', () => document.getElementById('goalModal').classList.add('hidden'));
  document.getElementById('goalForm').addEventListener('submit', saveGoal);

  // Modal Fondos Metas
  document.getElementById('btnCloseGoalFundModal').addEventListener('click', () => document.getElementById('goalFundModal').classList.add('hidden'));
  document.getElementById('btnCancelFund').addEventListener('click', () => document.getElementById('goalFundModal').classList.add('hidden'));
  document.getElementById('btnFundActionDeposit').addEventListener('click', () => setFundAction('deposit'));
  document.getElementById('btnFundActionWithdraw').addEventListener('click', () => setFundAction('withdraw'));
  document.getElementById('goalFundForm').addEventListener('submit', processGoalFund);

  // Modales Presupuestos
  document.getElementById('btnQuickEditGlobalLimit').addEventListener('click', openEditGlobalLimitModal);
  document.getElementById('btnEditGlobalLimit').addEventListener('click', openEditGlobalLimitModal);
  document.getElementById('btnCloseGlobalLimitModal').addEventListener('click', () => document.getElementById('globalLimitModal').classList.add('hidden'));
  document.getElementById('btnCancelGlobalLimit').addEventListener('click', () => document.getElementById('globalLimitModal').classList.add('hidden'));
  document.getElementById('globalLimitForm').addEventListener('submit', saveGlobalLimit);

  document.getElementById('btnOpenNewCategoryBudgetModal').addEventListener('click', () => openCategoryBudgetModal());
  document.getElementById('btnCloseCategoryBudgetModal').addEventListener('click', () => document.getElementById('categoryBudgetModal').classList.add('hidden'));
  document.getElementById('btnCancelCategoryBudget').addEventListener('click', () => document.getElementById('categoryBudgetModal').classList.add('hidden'));
  document.getElementById('categoryBudgetForm').addEventListener('submit', saveCategoryBudget);

  // Mobile connect / QR Code / Descarga Autónoma
  document.getElementById('btnConnectMobile').addEventListener('click', openMobileConnectModal);
  document.getElementById('btnOpenQRModalSettings').addEventListener('click', openMobileConnectModal);
  document.getElementById('btnCloseMobileConnectModal').addEventListener('click', () => document.getElementById('mobileConnectModal').classList.add('hidden'));
  document.getElementById('btnCopyMobileUrl').addEventListener('click', () => {
    const text = document.getElementById('mobileConnectUrl').textContent;
    navigator.clipboard.writeText(text).then(() => showToast('Dirección copiada al portapapeles', 'success'));
  });

  const btnMethodWifi = document.getElementById('btnMethodWifi');
  const btnMethodStandalone = document.getElementById('btnMethodStandalone');
  const viewWifi = document.getElementById('viewMobileWifi');
  const viewStandalone = document.getElementById('viewMobileStandalone');

  if (btnMethodWifi && btnMethodStandalone) {
    btnMethodWifi.addEventListener('click', () => {
      btnMethodWifi.className = 'py-2 rounded-lg bg-emerald-600 text-white shadow-sm transition';
      btnMethodStandalone.className = 'py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition';
      viewWifi.classList.remove('hidden');
      viewStandalone.classList.add('hidden');
    });

    btnMethodStandalone.addEventListener('click', () => {
      btnMethodStandalone.className = 'py-2 rounded-lg bg-emerald-600 text-white shadow-sm transition';
      btnMethodWifi.className = 'py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition';
      viewStandalone.classList.remove('hidden');
      viewWifi.classList.add('hidden');
    });
  }

  const btnDlStandalone = document.getElementById('btnDownloadStandaloneHtml');
  if (btnDlStandalone) {
    btnDlStandalone.addEventListener('click', downloadStandaloneMobileHtml);
  }

  // Filtros de transacciones
  document.getElementById('txSearchInput').addEventListener('input', applyTransactionFilters);
  document.getElementById('txCategoryFilter').addEventListener('change', applyTransactionFilters);
  document.querySelectorAll('.tx-type-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tx-type-filter').forEach(b => {
        b.classList.remove('active', 'bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-xs');
      });
      btn.classList.add('active', 'bg-white', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-white', 'shadow-xs');
      applyTransactionFilters();
    });
  });

  // Respaldo & Preferencias
  document.getElementById('btnExportJSON').addEventListener('click', exportDataJSON);
  document.getElementById('btnExportCSV').addEventListener('click', exportDataCSV);
  document.getElementById('importFileInput').addEventListener('change', (e) => {
    if (e.target.files.length) importDataJSON(e.target.files[0]);
  });

  document.getElementById('currencySelector').addEventListener('change', (e) => {
    state.currency = e.target.value;
    saveState();
    renderApp();
    showToast(`Moneda cambiada a ${state.currency}`, 'success');
  });

  document.getElementById('btnResetDemoData').addEventListener('click', () => {
    if (confirm('¿Deseas restaurar los datos de demostración en Pesos? Se reemplazarán tus datos actuales.')) {
      loadDefaultDemoData();
      renderApp();
      showToast('Datos de demostración en Pesos cargados', 'success');
    }
  });
}

// Iniciar app al cargar DOM
window.addEventListener('DOMContentLoaded', initApp);
