import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import { pinia } from '@/stores/pinia'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tabs/distance' },
  {
    path: '/auth/login',
    name: 'login',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/auth/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/auth/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/tabs',
    component: () => import('@/views/TabsLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/distance' },
      { path: 'distance', name: 'distance', component: () => import('@/views/tabs/DistanceTabPage.vue') },
      { path: 'map', name: 'map', component: () => import('@/views/tabs/MapTabPage.vue') },
      { path: 'esti-deploy', name: 'esti-deploy', component: () => import('@/modules/esti-deploy/pages/EstiDeployListPage.vue') },
      { path: 'profile', name: 'profile', component: () => import('@/views/tabs/ProfileTabPage.vue') },
    ],
  },
  {
    path: '/esti-deploy/editor',
    name: 'esti-deploy-editor',
    component: () => import('@/modules/esti-deploy/components/VoyageBudgetEditor.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/esti-deploy/editor/ports',
    name: 'esti-deploy-ports',
    redirect: '/esti-deploy/editor',
    meta: { requiresAuth: true },
  },
  {
    path: '/esti-deploy/editor/cargo',
    name: 'esti-deploy-cargo',
    redirect: '/esti-deploy/editor',
    meta: { requiresAuth: true },
  },
  {
    path: '/esti-deploy/editor/fuel',
    name: 'esti-deploy-fuel',
    redirect: '/esti-deploy/editor',
    meta: { requiresAuth: true },
  },
  {
    path: '/esti-deploy/editor/prices',
    name: 'esti-deploy-prices',
    redirect: '/esti-deploy/editor',
    meta: { requiresAuth: true },
  },
  {
    path: '/esti-deploy/editor/costs',
    name: 'esti-deploy-costs',
    redirect: '/esti-deploy/editor',
    meta: { requiresAuth: true },
  },
  {
    path: '/esti-deploy/detail/:id',
    name: 'esti-deploy-detail',
    component: () => import('@/modules/esti-deploy/pages/EstiDeployDetailPage.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/esti-deploy/map',
    name: 'esti-deploy-map',
    component: () => import('@/modules/esti-deploy/pages/EstiDeployMapPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/legacy-estimation',
    name: 'legacy-estimation',
    component: () => import('@/modules/legacy-estimation/pages/LegacyEstimationListPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/legacy-estimation/:id',
    name: 'legacy-estimation-detail',
    component: () => import('@/modules/legacy-estimation/pages/LegacyEstimationDetailPage.vue'),
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/account',
    name: 'profile-account',
    component: () => import('@/views/profile/AccountPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/password',
    name: 'profile-password',
    component: () => import('@/views/profile/PasswordPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/email',
    name: 'profile-email',
    component: () => import('@/views/profile/EmailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/language',
    name: 'profile-language',
    component: () => import('@/views/profile/LanguagePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/purchases',
    name: 'profile-purchases',
    component: () => import('@/views/profile/PurchaseRecordsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/contact',
    name: 'profile-contact',
    component: () => import('@/views/profile/ContactPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ships',
    name: 'ships',
    component: () => import('@/modules/ships/pages/ShipListPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ships/view',
    name: 'ship-view',
    component: () => import('@/modules/ships/pages/ShipDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ships/editor',
    name: 'ship-editor',
    component: () => import('@/modules/ships/pages/ShipEditorPage.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to: RouteLocationNormalized) => {
  const user = useUserStore(pinia)
  await user.restoreSession()

  if (to.meta.requiresAuth && !user.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && user.isAuthenticated) {
    return { name: 'distance' }
  }
  return true
})

export default router
