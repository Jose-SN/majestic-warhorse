import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RosterRow } from 'src/app/models/roster.model';
import { normalizeUserStatus } from 'src/app/models/user-status.model';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { StudentsApiService } from 'src/app/services/api-service/students-api.service';
import { TeachersApiService } from 'src/app/services/api-service/teachers-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { mapUserToLegacy } from 'src/app/shared/utils/user-mapper.util';

export type RosterDisplayUser = UserModel & {
  rosterRowId?: string;
  created_at?: string;
  updated_at?: string;
};

@Injectable({ providedIn: 'root' })
export class RosterDisplayService {
  constructor(
    private teachersApi: TeachersApiService,
    private studentsApi: StudentsApiService,
    private authService: AuthService,
    private commonService: CommonService
  ) {}

  async loadTeachers(orgId: string, status: string): Promise<RosterDisplayUser[]> {
    const [roster, iamUsers] = await Promise.all([
      firstValueFrom(
        this.teachersApi.listTeachers({ organization_id: orgId, status, limit: 500 })
      ),
      this.authService.resolveUsersForOrganization(orgId, this.commonService.allUsersList),
    ]);

    if (iamUsers.length) {
      this.commonService.allUsersList = iamUsers;
    }

    return this.mergeRosterWithUsers(roster, 'teacher', iamUsers);
  }

  async loadStudents(orgId: string, status: string): Promise<RosterDisplayUser[]> {
    const [roster, iamUsers] = await Promise.all([
      firstValueFrom(
        this.studentsApi.listStudents({ organization_id: orgId, status, limit: 500 })
      ),
      this.authService.resolveUsersForOrganization(orgId, this.commonService.allUsersList),
    ]);

    if (iamUsers.length) {
      this.commonService.allUsersList = iamUsers;
    }

    return this.mergeRosterWithUsers(roster, 'student', iamUsers);
  }

  private mergeRosterWithUsers(
    roster: RosterRow[],
    role: 'teacher' | 'student',
    iamUsers: UserModel[]
  ): RosterDisplayUser[] {
    return roster.map((row) => {
      const userId = String(row.user_id || row['userId'] || '').trim();
      const iam = iamUsers.find((user) => String(user.id) === userId);
      const inlineUser = this.extractInlineUserFromRow(row, userId);
      const base = iam
        ? mapUserToLegacy(iam)
        : inlineUser
          ? mapUserToLegacy(inlineUser)
          : ({} as UserModel);

      return {
        ...base,
        id: userId || base.id,
        rosterRowId: row.id,
        role,
        status: normalizeUserStatus(row.status) ?? row.status,
        organization_id: row.organization_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      } as RosterDisplayUser;
    });
  }

  private extractInlineUserFromRow(row: RosterRow, userId: string): UserModel | null {
    const nestedUser = (row['user'] as Record<string, unknown> | undefined) ?? {};
    const firstName = (row['first_name'] || row['firstName'] || nestedUser['first_name'] || nestedUser['firstName']) as
      | string
      | undefined;
    const lastName = (row['last_name'] || row['lastName'] || nestedUser['last_name'] || nestedUser['lastName']) as
      | string
      | undefined;
    const profileImage = (row['profile_image'] ||
      row['profileImage'] ||
      nestedUser['profile_image'] ||
      nestedUser['profileImage']) as string | undefined;
    const contact = (row['contact'] || nestedUser['contact']) as UserModel['contact'];
    const email = (row['email'] || nestedUser['email'] || contact?.email) as string | undefined;
    const name = (row['name'] || nestedUser['name']) as string | undefined;

    if (!firstName && !lastName && !name && !profileImage && !email && !contact?.email) {
      return null;
    }

    return {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      name,
      profile_image: profileImage,
      contact: contact ?? (email ? { email } : undefined),
      email,
    } as UserModel;
  }
}
