/**
 * Organization model matching DB schema:
 * id, name, contact, password, about, exp, jwt, leadership,
 * profile_image, cover_image, social, title, volunteers, plan, app_id
 */
export interface OrganizationContact {
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface Organization {
  id?: string;
  name: string;
  contact: OrganizationContact;
  password?: string;
  about?: string;
  exp?: string;
  jwt?: string;
  leadership?: unknown[];
  profile_image?: string;
  cover_image?: string;
  social?: Record<string, unknown>;
  title?: string;
  volunteers?: string[];
  plan?: number;
  app_id?: string;
}

/** Payload for creating/registering an organization - only required fields */
export interface OrganizationCreatePayload {
  name: string;
  contact: OrganizationContact;
  password: string;
  profile_image?: string;
  app_id?: string;
}

/** Response from organization save/login APIs */
export interface OrganizationResponse {
  success?: boolean;
  data?: Organization;
}
