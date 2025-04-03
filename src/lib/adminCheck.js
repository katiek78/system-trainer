export const isAdmin = (user) => {
  const adminEmail = process.env.ADMIN_EMAIL; // This is your environment variable
  return user?.email === adminEmail;
};
