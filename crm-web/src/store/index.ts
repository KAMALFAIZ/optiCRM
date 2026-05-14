import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from '@/features/auth/authSlice';
import contactsReducer from '@/features/contacts/contactsSlice';
import accountsReducer from '@/features/accounts/accountsSlice';
import leadsReducer from '@/features/leads/leadsSlice';
import opportunitiesReducer from '@/features/opportunities/opportunitiesSlice';
import quotesReducer from '@/features/quotes/quotesSlice';
import productsReducer from '@/features/stock/productsSlice';
import inventoryReducer from '@/features/stock/inventorySlice';
import paymentsReducer from '@/features/finance/paymentsSlice';
import objectionsReducer from '@/features/objections/objectionsSlice';
import usersReducer from '@/features/users/usersSlice';
import themeReducer from '@/features/settings/themeSlice';
import activitiesReducer from '@/features/activities/activitiesSlice';
import visitsReducer from '@/features/visits/visitsSlice';
import toursReducer from '@/features/tours/toursSlice';
import competitorsReducer from '@/features/competitors/competitorsSlice';
import invoicesReducer from '@/features/finance/invoicesSlice';
import salesOrdersReducer from '@/features/finance/salesOrdersSlice';
import dashboardReducer from '@/features/dashboard/dashboardSlice';
import campaignsReducer from '@/features/campaigns/campaignsSlice';
import emailTemplatesReducer from '@/features/email-templates/emailTemplatesSlice';
import expenseReportsReducer from '@/features/tours/expenseReports/expenseReportSlice';
import rolesReducer from '@/features/roles/rolesSlice';
import notificationsReducer from '@/features/notifications/notificationsSlice';
import workflowsReducer from '@/features/workflows/workflowsSlice';
import tenantReducer from '@/features/tenant/tenantSlice';
import googleCalendarReducer from '@/features/googleCalendar/googleCalendarSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    dashboard: dashboardReducer,
    campaigns: campaignsReducer,
    emailTemplates: emailTemplatesReducer,
    contacts: contactsReducer,
    accounts: accountsReducer,
    leads: leadsReducer,
    opportunities: opportunitiesReducer,
    quotes: quotesReducer,
    products: productsReducer,
    inventory: inventoryReducer,
    payments: paymentsReducer,
    objections: objectionsReducer,
    users: usersReducer,
    theme: themeReducer,
    activities: activitiesReducer,
    visits: visitsReducer,
    tours: toursReducer,
    competitors: competitorsReducer,
    invoices: invoicesReducer,
    salesOrders: salesOrdersReducer,
    expenseReports: expenseReportsReducer,
    roles: rolesReducer,
    notifications: notificationsReducer,
    workflows: workflowsReducer,
    googleCalendar: googleCalendarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
