import { UserModel } from 'src/app/pages/login-page/model/user-model';

/**
 * Maps new database structure to legacy fields for backward compatibility
 */
export function mapUserToLegacy(user: UserModel): UserModel {
  if (!user) return user;
  
  // If already mapped, return as is
  if (user.firstName && user.email) {
    return user;
  }

  // Map new structure to legacy fields
  const mappedUser: UserModel = {
    ...user,
    firstName: user.first_name || user.firstName || '',
    lastName: user.last_name || user.lastName,
    email: user.contact?.email || user.email || '',
    phone: user.contact?.phone || user.phone,
    profileImage: user.profile_image || user.profileImage,
    role: user.role || '',
  };

  return mappedUser;
}

/**
 * Maps legacy structure to new database structure
 */
export function mapLegacyToNew(user: any): any {
  if (!user) return user;

  // If already in new format, return as is
  if (user.first_name && user.contact) {
    return user;
  }

  // Map legacy to new structure
  return {
    ...user,
    first_name: user.firstName || user.first_name || '',
    last_name: user.lastName || user.last_name,
    profile_image: user.profileImage || user.profile_image || '',
    contact: {
      email: user.email || user.contact?.email || '',
      phone: user.phone || user.contact?.phone || '',
      ...(user.contact || {})
    },
    role: user.role || '',
    status: user.status || 'pending',
  };
}
