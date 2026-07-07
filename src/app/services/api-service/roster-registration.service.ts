import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserOAuthService } from 'src/app/core/auth/user-oauth.service';
import { StudentsApiService } from './students-api.service';
import { TeachersApiService } from './teachers-api.service';

export type RosterRole = 'teacher' | 'student';

export interface RegisterOnRosterInput {
  organizationId: string;
  role: RosterRole;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userId?: string;
  status?: 'pending' | 'approved';
}

@Injectable({ providedIn: 'root' })
export class RosterRegistrationService {
  constructor(
    private userOAuth: UserOAuthService,
    private teachersApi: TeachersApiService,
    private studentsApi: StudentsApiService
  ) {}

  /** Register an IAM user on the course-backend roster (teacher or student). */
  async registerOnRoster(input: RegisterOnRosterInput): Promise<void> {
    const orgId = input.organizationId;
    if (!orgId) {
      throw new Error('Organization id is required.');
    }

    let userId = input.userId || '';
    let firstName = input.firstName || '';
    let lastName = input.lastName || '';

    if (!userId && input.email) {
      const iamUser = await this.userOAuth.getUserByEmail(input.email);
      if (iamUser?.id) {
        userId = iamUser.id;
        firstName = firstName || iamUser.first_name || '';
        lastName = lastName || iamUser.last_name || '';
      }
    }

    const payload = {
      organization_id: orgId,
      status: input.status ?? 'pending',
      ...(userId ? { user_id: userId } : {}),
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      contact: {
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
      },
    };

    if (input.role === 'teacher') {
      await firstValueFrom(this.teachersApi.saveTeacher(payload));
      return;
    }

    await firstValueFrom(this.studentsApi.saveStudent(payload));
  }
}
