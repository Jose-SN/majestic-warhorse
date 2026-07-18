import { normalizeUserStatus } from 'src/app/models/user-status.model';
import { UserModel } from 'src/app/pages/login-page/model/user-model';

export function pickText(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    const text = value?.trim();
    if (text) {
      return text;
    }
  }
  return '';
}

function splitFullName(name?: string | null): { firstName: string; lastName: string } {
  const fullName = pickText(name);
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }

  const parts = fullName.split(/\s+/);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function deriveNameParts(user: UserModel): { firstName: string; lastName: string } {
  const firstName = pickText(user.firstName, user.first_name);
  const lastName = pickText(user.lastName, user.last_name);

  if (firstName || lastName) {
    return { firstName, lastName };
  }

  return splitFullName(user.name);
}

/**
 * Maps organization login response to UserModel shape (role: 'organization')
 */
export function mapOrganizationToUserShape(org: any): UserModel {
  if (!org) return org;
  const data = org.data ?? org;
  return {
    id: data.id || '',
    first_name: '',
    name: data.name || '',
    contact: data.contact || { email: data.contact?.email || '', phone: data.contact?.phone },
    profile_image: data.profile_image,
    role: 'organization',
    email: data.contact?.email || (data as any).email,
    phone: data.contact?.phone || (data as any).phone,
  } as UserModel;
}

/**
 * Maps new database structure to legacy fields for backward compatibility
 */
export function mapUserToLegacy(user: UserModel): UserModel {
  if (!user) return user;

  const { firstName, lastName } = deriveNameParts(user);
  const email = pickText(user.email, user.contact?.email);
  const phone = pickText(user.phone, user.contact?.phone);
  const profileImage = pickText(user.profileImage, user.profile_image);

  return {
    ...user,
    firstName,
    lastName,
    first_name: pickText(user.first_name, firstName),
    last_name: pickText(user.last_name, lastName),
    email,
    phone,
    profileImage,
    profile_image: pickText(user.profile_image, profileImage),
    role: user.role || '',
    status: normalizeUserStatus(user.status) || user.status,
  };
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
    first_name: pickText(user.firstName, user.first_name),
    last_name: pickText(user.lastName, user.last_name),
    profile_image: pickText(user.profileImage, user.profile_image),
    contact: {
      email: pickText(user.email, user.contact?.email),
      phone: pickText(user.phone, user.contact?.phone),
      ...(user.contact || {}),
    },
    role: user.role || '',
    status: normalizeUserStatus(user.status) || 'pending',
  };
}
