// ============================================================
// SSST Mock Data Layer — Phase 1
// All data persisted to localStorage with CRUD helpers
// ============================================================

import { ROLE_DEFAULTS } from '@/lib/permissions';

// ── Seed Data ──────────────────────────────────────────────

const SEED_DONATIONS = [
    { id: 'd1', receiptNo: 'SSST-2026-001', donorName: 'Ankit Sharma', mobile: '9876543210', address: '12, MG Road, Jaipur', amount: 5100, fundType: 'general', paymentMode: 'cash', date: '2026-02-01', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-01T10:30:00' },
    { id: 'd2', receiptNo: 'SSST-2026-002', donorName: 'Sunita Gupta', mobile: '9812345670', address: '45, Shastri Nagar, Jodhpur', amount: 11000, fundType: 'utsav', paymentMode: 'upi', date: '2026-02-03', notes: 'Holi Utsav', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-03T11:00:00' },
    { id: 'd3', receiptNo: 'SSST-2026-003', donorName: 'Mohanlal Bansal', mobile: '9812009988', address: 'Sector 5, Udaipur', amount: 2100, fundType: 'general', paymentMode: 'bankTransfer', date: '2026-02-05', notes: '', createdBy: 'u1', createdByName: 'Rajesh Sharma', createdAt: '2026-02-05T09:00:00' },
    { id: 'd4', receiptNo: 'SSST-2026-004', donorName: 'Kavita Mehta', mobile: '9900112233', address: 'Civil Lines, Ajmer', amount: 7500, fundType: 'general', paymentMode: 'upi', date: '2026-02-07', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-07T14:00:00' },
    { id: 'd5', receiptNo: 'SSST-2026-005', donorName: 'Deepak Agarwal', mobile: '9988776655', address: 'Vaishali Nagar, Jaipur', amount: 21000, fundType: 'utsav', paymentMode: 'cash', date: '2026-02-10', notes: 'Janmashtami', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-10T10:00:00' },
    { id: 'd6', receiptNo: 'SSST-2026-006', donorName: 'Radha Krishnan', mobile: '9765432109', address: 'Raja Park, Jaipur', amount: 1001, fundType: 'general', paymentMode: 'cash', date: '2026-02-12', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-12T11:30:00' },
    { id: 'd7', receiptNo: 'SSST-2026-007', donorName: 'Vikram Joshi', mobile: '9801234560', address: 'Malviya Nagar, Jaipur', amount: 5000, fundType: 'general', paymentMode: 'bankTransfer', date: '2026-02-14', notes: '', createdBy: 'u1', createdByName: 'Rajesh Sharma', createdAt: '2026-02-14T09:30:00' },
    { id: 'd8', receiptNo: 'SSST-2026-008', donorName: 'Seema Yadav', mobile: '9870123456', address: 'Jawahar Nagar, Jaipur', amount: 3100, fundType: 'general', paymentMode: 'upi', date: '2026-02-15', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-15T15:00:00' },
    { id: 'd9', receiptNo: 'SSST-2026-009', donorName: 'Harish Pareek', mobile: '9799001122', address: 'New Colony, Bhilwara', amount: 51000, fundType: 'utsav', paymentMode: 'bankTransfer', date: '2026-02-17', notes: 'Major Utsav sponsor', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-17T10:00:00' },
    { id: 'd10', receiptNo: 'SSST-2026-010', donorName: 'Pooja Singhal', mobile: '9988001234', address: 'Durgapura, Jaipur', amount: 2501, fundType: 'general', paymentMode: 'cash', date: '2026-02-18', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-18T12:00:00' },
    { id: 'd11', receiptNo: 'SSST-2026-011', donorName: 'Rambabu Gupta', mobile: '9654321098', address: 'Naya Bazar, Sikar', amount: 10000, fundType: 'general', paymentMode: 'upi', date: '2026-02-19', notes: '', createdBy: 'u1', createdByName: 'Rajesh Sharma', createdAt: '2026-02-19T11:00:00' },
    { id: 'd12', receiptNo: 'SSST-2026-012', donorName: 'Asha Jain', mobile: '9700123456', address: 'Station Road, Kota', amount: 4200, fundType: 'general', paymentMode: 'cash', date: '2026-02-20', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-20T09:00:00' },
    { id: 'd13', receiptNo: 'SSST-2026-013', donorName: 'Suresh Chand', mobile: '9654009988', address: 'Shyam Nagar, Jaipur', amount: 8100, fundType: 'utsav', paymentMode: 'upi', date: '2026-02-21', notes: 'Holi decoration', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-21T10:30:00' },
    { id: 'd14', receiptNo: 'SSST-2026-014', donorName: 'Mamta Sharma', mobile: '9876001100', address: 'Pratap Nagar, Jaipur', amount: 1500, fundType: 'general', paymentMode: 'cash', date: '2026-02-22', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-22T14:00:00' },
    { id: 'd15', receiptNo: 'SSST-2026-015', donorName: 'Gopal Verma', mobile: '9812330099', address: 'Adarsh Nagar, Bikaner', amount: 15000, fundType: 'utsav', paymentMode: 'bankTransfer', date: '2026-02-24', notes: 'Puja samagri sponsor', createdBy: 'u1', createdByName: 'Rajesh Sharma', createdAt: '2026-02-24T10:00:00' },
    { id: 'd16', receiptNo: 'SSST-2026-016', donorName: 'Neha Agarwal', mobile: '9901234321', address: 'C-Scheme, Jaipur', amount: 3333, fundType: 'general', paymentMode: 'upi', date: '2026-02-25', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-25T09:30:00' },
    { id: 'd17', receiptNo: 'SSST-2026-017', donorName: 'Dinesh Kumar', mobile: '9870098700', address: 'Khatipura, Jaipur', amount: 11111, fundType: 'general', paymentMode: 'cash', date: '2026-02-25', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-25T11:00:00' },
    { id: 'd18', receiptNo: 'SSST-2026-018', donorName: 'Savita Mishra', mobile: '9654321099', address: 'Nirman Nagar, Jaipur', amount: 6000, fundType: 'general', paymentMode: 'upi', date: '2026-02-26', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-26T09:00:00' },
    { id: 'd19', receiptNo: 'SSST-2026-019', donorName: 'Manoj Tiwari', mobile: '9812000111', address: 'Mansarovar, Jaipur', amount: 2000, fundType: 'utsav', paymentMode: 'cash', date: '2026-02-26', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-26T10:00:00' },
    { id: 'd20', receiptNo: 'SSST-2026-020', donorName: 'Rekha Sharma', mobile: '9900998877', address: 'Sodala, Jaipur', amount: 4500, fundType: 'general', paymentMode: 'bankTransfer', date: '2026-02-26', notes: '', createdBy: 'u4', createdByName: 'Ramesh Kumar', createdAt: '2026-02-26T11:00:00' },
];

const SEED_EXPENSES = [
    { id: 'e1', category: 'tent', vendor: 'Sharma Tent House', amount: 15000, paymentMode: 'cash', date: '2026-02-05', notes: 'Holi Utsav tent setup', billImage: null, status: 'approved', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', createdAt: '2026-02-05T10:00:00' },
    { id: 'e2', category: 'prasad', vendor: 'Om Sweets', amount: 8500, paymentMode: 'cash', date: '2026-02-06', notes: 'Prasad for weekly puja', billImage: null, status: 'approved', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', createdAt: '2026-02-06T09:00:00' },
    { id: 'e3', category: 'electricity', vendor: 'JVVNL Bill', amount: 3200, paymentMode: 'bankTransfer', date: '2026-02-08', notes: 'January electricity bill', billImage: null, status: 'approved', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', createdAt: '2026-02-08T11:00:00' },
    { id: 'e4', category: 'construction', vendor: 'Ramji Construction Co.', amount: 45000, paymentMode: 'bankTransfer', date: '2026-02-10', notes: 'Garbhagriha floor tiling work', billImage: null, status: 'approved', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', createdAt: '2026-02-10T09:30:00' },
    { id: 'e5', category: 'decoration', vendor: 'Jai Shyam Decorators', amount: 12000, paymentMode: 'upi', date: '2026-02-12', notes: 'Holi decoration flowers', billImage: null, status: 'approved', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', createdAt: '2026-02-12T10:00:00' },
    { id: 'e6', category: 'prasad', vendor: 'Shyam Bhog', amount: 5600, paymentMode: 'cash', date: '2026-02-14', notes: 'Basant Panchami prasad', billImage: null, status: 'approved', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', createdAt: '2026-02-14T08:00:00' },
    { id: 'e7', category: 'other', vendor: 'ABC Printing Press', amount: 2800, paymentMode: 'cash', date: '2026-02-15', notes: 'Printing receipts & banners', billImage: null, status: 'approved', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', createdAt: '2026-02-15T12:00:00' },
    { id: 'e8', category: 'construction', vendor: 'Shri Hardware Store', amount: 18000, paymentMode: 'bankTransfer', date: '2026-02-17', notes: 'Cement, sand and bricks', billImage: null, status: 'approved', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', createdAt: '2026-02-17T09:00:00' },
    { id: 'e9', category: 'tent', vendor: 'Royal Tent Service', amount: 9000, paymentMode: 'cash', date: '2026-02-19', notes: 'Weekly satsang canopy', billImage: null, status: 'pending', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: null, approvedByName: null, createdAt: '2026-02-19T10:00:00' },
    { id: 'e10', category: 'prasad', vendor: 'Gopal Mithai Bhandar', amount: 7200, paymentMode: 'upi', date: '2026-02-20', notes: 'Sunday bhandara prasad', billImage: null, status: 'pending', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: null, approvedByName: null, createdAt: '2026-02-20T11:00:00' },
    { id: 'e11', category: 'electricity', vendor: 'Electrician Ramesh', amount: 1500, paymentMode: 'cash', date: '2026-02-21', notes: 'New wiring for main hall', billImage: null, status: 'pending', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: null, approvedByName: null, createdAt: '2026-02-21T14:00:00' },
    { id: 'e12', category: 'decoration', vendor: 'Phool Wala', amount: 4500, paymentMode: 'cash', date: '2026-02-22', notes: 'Daily flower garlands (Feb)', billImage: null, status: 'pending', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: null, approvedByName: null, createdAt: '2026-02-22T09:30:00' },
    { id: 'e13', category: 'other', vendor: 'Telecom Recharge', amount: 999, paymentMode: 'upi', date: '2026-02-23', notes: 'WhatsApp Business plan', billImage: null, status: 'pending', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: null, approvedByName: null, createdAt: '2026-02-23T10:00:00' },
    { id: 'e14', category: 'construction', vendor: 'Shiv Marble Works', amount: 62000, paymentMode: 'bankTransfer', date: '2026-02-24', notes: 'Marble flooring — main hall', billImage: null, status: 'pending', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: null, approvedByName: null, createdAt: '2026-02-24T10:30:00' },
    { id: 'e15', category: 'other', vendor: 'Stationery Mart', amount: 1200, paymentMode: 'cash', date: '2026-02-26', notes: 'Office stationery', billImage: null, status: 'rejected', createdBy: 'u4', createdByName: 'Ramesh Kumar', approvedBy: 'u1', approvedByName: 'Rajesh Sharma', rejectionReason: 'Duplicate entry — already logged on Feb 25.', createdAt: '2026-02-26T09:00:00' },
];

const SEED_USERS = [
    { id: 'u1', name: 'Rajesh Sharma', mobile: '9999999901', role: 'super_admin', useRoleDefaults: true, permissions: ROLE_DEFAULTS.super_admin, isActive: true, avatar: 'RS', lastLogin: '2026-02-26T09:30:00', createdAt: '2025-01-01' },
    { id: 'u2', name: 'Priya Agarwal', mobile: '9999999902', role: 'founder', useRoleDefaults: true, permissions: ROLE_DEFAULTS.founder, isActive: true, avatar: 'PA', lastLogin: '2026-02-25T14:00:00', createdAt: '2025-01-01' },
    { id: 'u3', name: 'CA Sunil Mittal', mobile: '9999999903', role: 'ca', useRoleDefaults: true, permissions: ROLE_DEFAULTS.ca, isActive: true, avatar: 'SM', lastLogin: '2026-02-20T11:15:00', createdAt: '2025-01-15' },
    { id: 'u4', name: 'Ramesh Kumar', mobile: '9999999904', role: 'staff', useRoleDefaults: true, permissions: ROLE_DEFAULTS.staff, isActive: true, avatar: 'RK', lastLogin: '2026-02-26T10:00:00', createdAt: '2025-02-01' },
    { id: 'u5', name: 'Anita Bhatnagar', mobile: '9999999905', role: 'staff', useRoleDefaults: false, permissions: [...ROLE_DEFAULTS.staff, 'report.export'], isActive: true, avatar: 'AB', lastLogin: '2026-02-25T16:00:00', createdAt: '2025-03-01' },
    { id: 'u6', name: 'Karan Mathur', mobile: '9999999906', role: 'staff', useRoleDefaults: true, permissions: ROLE_DEFAULTS.staff, isActive: false, avatar: 'KM', lastLogin: '2026-01-10T09:00:00', createdAt: '2025-04-01' },
];

// ── Seed Utsavs ────────────────────────────────────────────
const SEED_UTSAVS = [
    {
        id: 'utsav1',
        name: 'Holi Utsav 2026',
        nameHi: 'होली उत्सव 2026',
        description: 'Holi celebration with puja, bhajan, and bhandara',
        startDate: '2026-03-13',
        endDate: '2026-03-14',
        targetAmount: 100000,
        isActive: true,
        createdBy: 'u1',
        createdByName: 'Rajesh Sharma',
        createdAt: '2026-02-01T09:00:00',
    },
    {
        id: 'utsav2',
        name: 'Janmashtami Utsav 2026',
        nameHi: 'जन्माष्टमी उत्सव 2026',
        description: 'Janmashtami celebration — midnight puja and jhankis',
        startDate: '2026-08-15',
        endDate: '2026-08-16',
        targetAmount: 200000,
        isActive: true,
        createdBy: 'u1',
        createdByName: 'Rajesh Sharma',
        createdAt: '2026-02-01T09:30:00',
    },
    {
        id: 'utsav3',
        name: 'Shyam Jayanti 2026',
        nameHi: 'श्याम जयंती 2026',
        description: 'Annual Shyam Jayanti with cultural programs',
        startDate: '2026-09-20',
        endDate: '2026-09-21',
        targetAmount: 150000,
        isActive: false,
        createdBy: 'u1',
        createdByName: 'Rajesh Sharma',
        createdAt: '2026-02-10T10:00:00',
    },
];

// ── Storage Keys ───────────────────────────────────────────
const KEYS = {
    donations: 'ssst_donations',
    expenses: 'ssst_expenses',
    users: 'ssst_users',
    utsavs: 'ssst_utsavs',
    settings: 'ssst_settings',
};

const DEFAULT_SETTINGS = { upiQrUrl: '', upiQrPublicId: '', trustName: 'Shri Shyam Sarnam Seva Trust' };


function load(key, seed) {
    if (typeof window === 'undefined') return seed;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : seed;
    } catch {
        return seed;
    }
}

function save(key, data) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId(prefix) {
    return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateReceiptNo() {
    const donations = load(KEYS.donations, SEED_DONATIONS);
    const num = donations.length + 1;
    return `SSST-2026-${String(num).padStart(3, '0')}`;
}

// ── Donation CRUD ──────────────────────────────────────────
export const getDonations = () => load(KEYS.donations, SEED_DONATIONS);

export const createDonation = (data) => {
    const donations = getDonations();
    const newItem = {
        ...data,
        id: generateId('d'),
        receiptNo: generateReceiptNo(),
        createdAt: new Date().toISOString(),
    };
    save(KEYS.donations, [newItem, ...donations]);
    return newItem;
};

export const updateDonation = (id, data) => {
    const donations = getDonations().map((d) => (d.id === id ? { ...d, ...data } : d));
    save(KEYS.donations, donations);
    return donations.find((d) => d.id === id);
};

export const deleteDonation = (id) => {
    const donations = getDonations().filter((d) => d.id !== id);
    save(KEYS.donations, donations);
};

// ── Expense CRUD ───────────────────────────────────────────
export const getExpenses = () => load(KEYS.expenses, SEED_EXPENSES);

export const createExpense = (data) => {
    const expenses = getExpenses();
    const newItem = {
        ...data,
        id: generateId('e'),
        status: 'pending',
        approvedBy: null,
        approvedByName: null,
        createdAt: new Date().toISOString(),
    };
    save(KEYS.expenses, [newItem, ...expenses]);
    return newItem;
};

export const approveExpense = (id, approverUser) => {
    const expenses = getExpenses().map((e) =>
        e.id === id
            ? { ...e, status: 'approved', approvedBy: approverUser.id, approvedByName: approverUser.name, rejectionReason: null }
            : e
    );
    save(KEYS.expenses, expenses);
};

export const rejectExpense = (id, approverUser, reason) => {
    const expenses = getExpenses().map((e) =>
        e.id === id
            ? { ...e, status: 'rejected', approvedBy: approverUser.id, approvedByName: approverUser.name, rejectionReason: reason }
            : e
    );
    save(KEYS.expenses, expenses);
};

export const updateExpense = (id, data) => {
    const expenses = getExpenses().map((e) => (e.id === id ? { ...e, ...data } : e));
    save(KEYS.expenses, expenses);
};

// ── Settings ────────────────────────────────────────────────
export const getSettings = () => load(KEYS.settings, DEFAULT_SETTINGS);
export const saveSettings = (data) => save(KEYS.settings, { ...getSettings(), ...data });

export const deleteExpense = (id) => {
    const expenses = getExpenses().filter((e) => e.id !== id);
    save(KEYS.expenses, expenses);
};

// ── Utsav CRUD ────────────────────────────────────────────
export const getUtsavs = () => load(KEYS.utsavs, SEED_UTSAVS);
export const getActiveUtsavs = () => getUtsavs().filter((u) => u.isActive);

export const createUtsav = (data) => {
    const utsavs = getUtsavs();
    const newUtsav = {
        ...data,
        id: generateId('utsav'),
        createdAt: new Date().toISOString(),
    };
    save(KEYS.utsavs, [newUtsav, ...utsavs]);
    return newUtsav;
};

export const updateUtsav = (id, data) => {
    const utsavs = getUtsavs().map((u) => (u.id === id ? { ...u, ...data } : u));
    save(KEYS.utsavs, utsavs);
    return utsavs.find((u) => u.id === id);
};

export const deleteUtsav = (id) => {
    const utsavs = getUtsavs().filter((u) => u.id !== id);
    save(KEYS.utsavs, utsavs);
};

// Get total donations for a specific Utsav
export const getUtsavDonations = (utsavId) =>
    getDonations().filter((d) => d.utsavId === utsavId);

export const getUtsavSummary = (utsavId) => {
    const donations = getUtsavDonations(utsavId);
    const total = donations.reduce((s, d) => s + d.amount, 0);
    return { total, count: donations.length, donations };
};

// ── User CRUD ──────────────────────────────────────────────
export const getUsers = () => load(KEYS.users, SEED_USERS);

export const createUser = (data) => {
    const users = getUsers();
    const newUser = { ...data, id: generateId('u'), createdAt: new Date().toISOString(), lastLogin: null };
    save(KEYS.users, [...users, newUser]);
    return newUser;
};

export const updateUser = (id, data) => {
    const users = getUsers().map((u) => (u.id === id ? { ...u, ...data } : u));
    save(KEYS.users, users);
    return users.find((u) => u.id === id);
};

export const deleteUser = (id) => {
    const users = getUsers().filter((u) => u.id !== id);
    save(KEYS.users, users);
};

// ── Summary Helpers ────────────────────────────────────────
export const getDashboardSummary = () => {
    const donations = getDonations();
    const expenses = getExpenses();

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const mtdDonations = donations.filter((d) => {
        const dt = new Date(d.date);
        return dt.getMonth() === month && dt.getFullYear() === year;
    });

    const mtdExpenses = expenses.filter((e) => {
        const dt = new Date(e.date);
        return dt.getMonth() === month && dt.getFullYear() === year && e.status === 'approved';
    });

    const totalDonations = mtdDonations.reduce((s, d) => s + d.amount, 0);
    const totalExpenses = mtdExpenses.reduce((s, e) => s + e.amount, 0);
    const pendingCount = expenses.filter((e) => e.status === 'pending').length;

    const fundBreakdown = {
        general: mtdDonations.filter((d) => d.fundType === 'general').reduce((s, d) => s + d.amount, 0),
        utsav: mtdDonations.filter((d) => d.fundType === 'utsav').reduce((s, d) => s + d.amount, 0),
    };

    return { totalDonations, totalExpenses, netBalance: totalDonations - totalExpenses, pendingCount, fundBreakdown };
};

// ── Format Helpers ─────────────────────────────────────────
export const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
