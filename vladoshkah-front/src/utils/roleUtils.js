export const isShelterAdminRole = (role) =>
  role === 'shelter_admin' || role === 'admin_shelter'

export const normalizeRole = (role) =>
  role === 'admin_shelter' ? 'shelter_admin' : role

export const normalizeUserRole = (user) => {
  if (!user) return user
  return {
    ...user,
    role: normalizeRole(user.role)
  }
}
