'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTableRemoveButton } from '@/components/admin/AdminTableRemoveButton/AdminTableRemoveButton';
import { AdminListShell } from '@/components/admin/AdminListShell/AdminListShell';
import { AdminSelect, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { adminBackendFetch, adminBackendJson } from '@/lib/adminBackendFetch';
import { adminUserGroupsPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { useAdminConfirm } from '@/lib/adminConfirm/useAdminConfirm';
import { ADMIN_PROFILE_PRIMARY_LABEL } from '@/lib/adminProfilePrimary';
import type { DesignerBonusProfileRow, ReferralProgramProfileRow } from '@/lib/adminUserGroupProfilesTypes';
import type { UserGroupDetailRow, UserGroupMemberRow, UserGroupRow } from '@/lib/adminUserGroupsTypes';
import type { PricingProfileRow } from '../settings/pricingAdminTypes';
import catalogStyles from '../catalog/catalogAdmin.module.css';
import panelStyles from '../settings/pricing/pricingSettings.module.css';
import { UserGroupMembersPickerModal } from './UserGroupMembersPickerModal';

function profileOptionLabel(name: string, isDefault: boolean) {
  return isDefault ? `${name} (${ADMIN_PROFILE_PRIMARY_LABEL})` : name;
}

export function UserGroupsAdminClient() {
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminUserGroupsPage(locale), [locale]);
  const { confirm } = useAdminConfirm();

  const [groups, setGroups] = useState<UserGroupRow[]>([]);
  const [referralProfiles, setReferralProfiles] = useState<ReferralProgramProfileRow[]>([]);
  const [bonusProfiles, setBonusProfiles] = useState<DesignerBonusProfileRow[]>([]);
  const [pricingProfiles, setPricingProfiles] = useState<PricingProfileRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [referralProfileId, setReferralProfileId] = useState('');
  const [bonusProfileId, setBonusProfileId] = useState('');
  const [pricingProfileId, setPricingProfileId] = useState('');
  const [members, setMembers] = useState<UserGroupMemberRow[]>([]);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const error = mutationError ?? loadError;
  const selected = groups.find((g) => g.id === selectedId) ?? null;
  const memberUserIds = useMemo(() => new Set(members.map((m) => m.userId)), [members]);

  const loadGroups = useCallback(async () => {
    const rows = await adminBackendJson<UserGroupRow[]>('settings/admin/user-groups');
    setGroups(rows);
    setSelectedId((cur) => {
      if (cur && rows.some((r) => r.id === cur)) return cur;
      return rows[0]?.id ?? null;
    });
  }, []);

  const loadMembers = useCallback(async (groupId: string) => {
    const res = await adminBackendJson<{ items: UserGroupMemberRow[] }>(
      `settings/admin/user-groups/${groupId}/members?take=100`,
    );
    setMembers(res.items);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [refs, bonuses, pricing] = await Promise.all([
        adminBackendJson<ReferralProgramProfileRow[]>('settings/admin/referral-program-profiles'),
        adminBackendJson<DesignerBonusProfileRow[]>('settings/admin/designer-bonus-profiles'),
        adminBackendJson<PricingProfileRow[]>('catalog/admin/pricing-profiles'),
      ]);
      setReferralProfiles(refs);
      setBonusProfiles(bonuses);
      setPricingProfiles(pricing);
      await loadGroups();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t.errLoad);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [loadGroups, t.errLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setName('');
      setLabel('');
      setReferralProfileId('');
      setBonusProfileId('');
      setPricingProfileId('');
      setMembers([]);
      setMemberPickerOpen(false);
      return;
    }
    setName(selected.name);
    setLabel(selected.label);
    setReferralProfileId(selected.referralProgramProfileId);
    setBonusProfileId(selected.designerBonusProfileId);
    setPricingProfileId(selected.pricingProfileId ?? '');
    setMemberPickerOpen(false);
    void loadMembers(selected.id);
  }, [selected, loadMembers]);

  async function createGroup() {
    const defaultRef = referralProfiles.find((p) => p.isDefault) ?? referralProfiles[0];
    const defaultBonus = bonusProfiles.find((p) => p.isDefault) ?? bonusProfiles[0];
    if (!defaultRef || !defaultBonus) {
      setMutationError(t.errCreateProfiles);
      return;
    }
    setSaving(true);
    setMutationError(null);
    try {
      const row = await adminBackendJson<UserGroupDetailRow>('settings/admin/user-groups', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Новая группа',
          label: 'Группа',
          referralProgramProfileId: defaultRef.id,
          designerBonusProfileId: defaultBonus.id,
        }),
      });
      await loadGroups();
      setSelectedId(row.id);
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : t.errCreate);
    } finally {
      setSaving(false);
    }
  }

  async function saveGroup() {
    if (!selected) return;
    if (!referralProfileId || !bonusProfileId) {
      setMutationError(t.errPickProfiles);
      return;
    }
    setSaving(true);
    setMutationError(null);
    try {
      await adminBackendJson(`settings/admin/user-groups/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim() || selected.name,
          label: label.trim() || selected.label,
          referralProgramProfileId: referralProfileId,
          designerBonusProfileId: bonusProfileId,
          pricingProfileId: pricingProfileId || null,
        }),
      });
      await load();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : t.errSave);
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup() {
    if (!selected) return;
    if (!(await confirm({ title: t.confirmDelete(selected.name) }))) return;
    setSaving(true);
    setMutationError(null);
    try {
      const res = await adminBackendFetch(`settings/admin/user-groups/${selected.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(typeof j.message === 'string' ? j.message : t.errDelete);
      }
      setSelectedId(null);
      await load();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : t.errDelete);
    } finally {
      setSaving(false);
    }
  }

  async function addMembers(userIds: string[]) {
    if (!selected) return;
    const toAdd = userIds.filter((id) => !memberUserIds.has(id));
    if (toAdd.length === 0) return;
    setSaving(true);
    setMutationError(null);
    try {
      for (const userId of toAdd) {
        await adminBackendJson(`settings/admin/user-groups/${selected.id}/members`, {
          method: 'POST',
          body: JSON.stringify({ userId }),
        });
      }
      await Promise.all([loadGroups(), loadMembers(selected.id)]);
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : t.errAddMember);
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(userId: string) {
    if (!selected) return;
    setSaving(true);
    setMutationError(null);
    try {
      const res = await adminBackendFetch(
        `settings/admin/user-groups/${selected.id}/members/${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(typeof j.message === 'string' ? j.message : t.errRemoveMember);
      }
      await Promise.all([loadGroups(), loadMembers(selected.id)]);
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : t.errRemoveMember);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminListShell
      loading={loading}
      error={error}
      onRetry={() => void load()}
      loadingLabel={t.loading}
      isEmpty={false}
      wrapContent={false}
    >
      <div className={`${panelStyles.layout} ${panelStyles.grid}`}>
        <div className={panelStyles.listPanel}>
          <div className={panelStyles.listHeader}>
            <h2 className={`${catalogStyles.groupHeading} ${panelStyles.panelHeading}`}>
              {t.groupsHeading}
            </h2>
            <AdminCompactBtn disabled={saving || loading} onClick={() => void createGroup()}>
              {t.addGroup}
            </AdminCompactBtn>
          </div>
          <ul className={panelStyles.profileList}>
            {groups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className={`${panelStyles.profileItem} ${
                    g.id === selectedId ? panelStyles.profileItemActive : ''
                  }`}
                  onClick={() => setSelectedId(g.id)}
                >
                  <span className={panelStyles.profileName}>{g.name}</span>
                  <span className={panelStyles.profileMeta}>
                    {g.label} · {t.membersCount(g.memberCount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={panelStyles.listPanel}>
          {selected ? (
            <>
              <h2 className={`${catalogStyles.groupHeading} ${panelStyles.panelHeading}`}>
                {t.paramsHeading}
              </h2>
              <div className={panelStyles.profileFormFields}>
                <AdminTextField
                  label={t.fieldName}
                  name="groupName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
                <AdminTextField
                  label={t.fieldLabel}
                  name="groupLabel"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  autoComplete="off"
                />
                <AdminSelect
                  label={t.fieldReferralProfile}
                  name="referralProfileId"
                  value={referralProfileId}
                  onChange={(e) => setReferralProfileId(e.target.value)}
                >
                  {referralProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {profileOptionLabel(p.name, p.isDefault)}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label={t.fieldBonusProfile}
                  name="bonusProfileId"
                  value={bonusProfileId}
                  onChange={(e) => setBonusProfileId(e.target.value)}
                >
                  {bonusProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {profileOptionLabel(p.name, p.isDefault)}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label={t.fieldPricingProfile}
                  name="pricingProfileId"
                  value={pricingProfileId}
                  onChange={(e) => setPricingProfileId(e.target.value)}
                >
                  <option value="">{t.pricingProfileNone}</option>
                  {pricingProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.trim() || p.id}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              <div className={`${catalogStyles.formActions} ${panelStyles.profileFormActions}`}>
                <AdminCompactBtn variant="accent" disabled={saving} onClick={() => void saveGroup()}>
                  {saving ? t.saving : t.save}
                </AdminCompactBtn>
                <AdminCompactBtn
                  variant="danger"
                  disabled={saving || selected.memberCount > 0}
                  title={selected.memberCount > 0 ? t.deleteBlocked : undefined}
                  onClick={() => void deleteGroup()}
                >
                  {t.delete}
                </AdminCompactBtn>
              </div>

              <hr className={panelStyles.profileSectionDivider} />

              <div className={panelStyles.membersSectionHeader}>
                <h2 className={`${catalogStyles.groupHeading} ${panelStyles.panelHeading}`}>
                  {t.membersHeading(selected.memberCount)}
                </h2>
                <AdminCompactBtn disabled={saving} onClick={() => setMemberPickerOpen(true)}>
                  {t.pickMembers}
                </AdminCompactBtn>
              </div>
              {members.length === 0 ? (
                <p className={catalogStyles.muted}>{t.emptyMembers}</p>
              ) : (
                <div className={catalogStyles.tableWrap}>
                  <table className={catalogStyles.table}>
                    <thead>
                      <tr>
                        <th>{t.colMemberName}</th>
                        <th>{t.colMemberEmail}</th>
                        <th className={catalogStyles.tableCellActions} aria-hidden />
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => {
                        const nm = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
                        const displayName = nm || m.email || m.userId;
                        return (
                          <tr key={m.id}>
                            <td>
                              <Link href={`/admin/clients/${encodeURIComponent(m.userId)}`}>
                                {displayName}
                              </Link>
                            </td>
                            <td>{m.email?.trim() || '—'}</td>
                            <td className={catalogStyles.tableCellActions}>
                              <AdminTableRemoveButton
                                label={t.removeMemberAria}
                                disabled={saving}
                                onClick={() => void removeMember(m.userId)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <UserGroupMembersPickerModal
                open={memberPickerOpen}
                excludedUserIds={memberUserIds}
                saving={saving}
                onClose={() => setMemberPickerOpen(false)}
                onSave={(userIds) => addMembers(userIds)}
              />
            </>
          ) : (
            <p className={catalogStyles.muted}>{t.selectOrCreate}</p>
          )}
        </div>
      </div>
    </AdminListShell>
  );
}
