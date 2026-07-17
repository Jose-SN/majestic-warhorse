import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RosterRow } from 'src/app/models/roster.model';
import { normalizeUserStatus } from 'src/app/models/user-status.model';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { StudentsApiService } from 'src/app/services/api-service/students-api.service';
import { TeachersApiService } from 'src/app/services/api-service/teachers-api.service';
import { mapUserToLegacy } from 'src/app/shared/utils/user-mapper.util';

export type RosterDisplayUser = UserModel & { rosterRowId?: string };

@Injectable({ providedIn: 'root' })
export class RosterDisplayService {
  constructor(
    private teachersApi: TeachersApiService,
    private studentsApi: StudentsApiService,
    private authService: AuthService
  ) {}

  async loadTeachers(orgId: string, status: string): Promise<RosterDisplayUser[]> {
    const roster = await firstValueFrom(
      this.teachersApi.listTeachers({ organization_id: orgId, status, limit: 500 })
    );
    return this.mergeRosterRows(roster, 'teacher');
  }

  async loadStudents(orgId: string, status: string): Promise<RosterDisplayUser[]> {
    const roster = await firstValueFrom(
      this.studentsApi.listStudents({ organization_id: orgId, status, limit: 500 })
    );
    return this.mergeRosterRows(roster, 'student');
  }

  private async mergeRosterRows(
    roster: RosterRow[],
    role: 'teacher' | 'student'
  ): Promise<RosterDisplayUser[]> {
    const iamUsers = await this.authService.getAllUsers();
    return roster.map((row) => {
      const iam = iamUsers.find((u) => u.id === row.user_id);
      const base = iam ? mapUserToLegacy(iam) : ({} as UserModel);
      return {
        ...base,
        id: row.user_id,
        rosterRowId: row.id,
        role,
        status: normalizeUserStatus(row.status) ?? row.status,
        organization_id: row.organization_id,
      } as RosterDisplayUser;
    });
  }
}
