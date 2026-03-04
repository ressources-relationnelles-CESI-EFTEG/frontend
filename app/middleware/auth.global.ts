export default defineNuxtRouteMiddleware((to) => {
  const { restoreSession, isLoggedIn } = useAuth();

  restoreSession();

  const protectedRoutes = ['/profile'];
  const requiresAuth = protectedRoutes.some((route) => to.path.startsWith(route));

  if (requiresAuth && !isLoggedIn.value) {
    return navigateTo('/sign-in');
  }
});
