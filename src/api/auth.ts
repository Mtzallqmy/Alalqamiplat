import { loginAdmin, getAdminSession } from '@/src/auth/context';

export async function loginApi(email: string, password: string) {
  const result = await loginAdmin(email, password);
  if (!result.success) {
    throw new Error(result.message || 'فشل تسجيل الدخول');
  }
  return result;
}

export async function getMeApi() {
  const session = await getAdminSession();
  if (!session.token || !session.user) {
    throw new Error('لا توجد جلسة إدارة نشطة');
  }
  return session.user;
}
