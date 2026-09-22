"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useSession } from "@/components/providers/session-provider";
import { SmartLookup, type SmartLookupOption } from "@/components/ui/smart-lookup";

type BranchRecord = {
  id: string;
  code: string;
  displayName: string;
  legalName: string;
  status: "active" | "inactive";
};

type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  defaultBranchId: string | null;
  status: "active" | "invited" | "inactive";
};

type RoleRecord = {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  status: "active" | "inactive";
  isSystemManaged: boolean;
};

type PermissionRecord = {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
};

type CommunityRecord = {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  status: "active" | "inactive";
};

type AccessSummary = {
  roles: Array<{
    assignmentId: string;
    roleId: string;
    code: string;
    displayName: string;
    assignedBranchId: string | null;
    assignedBranchLabel: string | null;
  }>;
  communities: Array<{
    membershipId: string;
    communityId: string;
    code: string;
    displayName: string;
  }>;
  branchScopes: Array<{
    scopeId: string;
    branchId: string;
    branchLabel: string;
    scopeType: "member" | "manager" | "admin";
  }>;
  effectiveAccess: {
    branchIds: string[];
    permissions: string[];
    communities: string[];
  };
};

type UserForm = {
  email: string;
  displayName: string;
  password: string;
  defaultBranchId: string;
  status: "active" | "invited" | "inactive";
};

type RoleForm = {
  code: string;
  displayName: string;
  description: string;
  status: "active" | "inactive";
  isSystemManaged: boolean;
};

type PermissionForm = {
  code: string;
  displayName: string;
  description: string;
};

type CommunityForm = {
  code: string;
  displayName: string;
  description: string;
  status: "active" | "inactive";
};

type AccessTab = "users" | "roles" | "permissions" | "communities";

const emptyUserForm = (): UserForm => ({
  email: "",
  displayName: "",
  password: "",
  defaultBranchId: "",
  status: "active",
});

const emptyRoleForm = (): RoleForm => ({
  code: "",
  displayName: "",
  description: "",
  status: "active",
  isSystemManaged: false,
});

const emptyPermissionForm = (): PermissionForm => ({
  code: "",
  displayName: "",
  description: "",
});

const emptyCommunityForm = (): CommunityForm => ({
  code: "",
  displayName: "",
  description: "",
  status: "active",
});

function mapUserToForm(user: UserRecord): UserForm {
  return {
    email: user.email,
    displayName: user.displayName,
    password: "",
    defaultBranchId: user.defaultBranchId ?? "",
    status: user.status,
  };
}

function mapRoleToForm(role: RoleRecord): RoleForm {
  return {
    code: role.code,
    displayName: role.displayName,
    description: role.description ?? "",
    status: role.status,
    isSystemManaged: role.isSystemManaged,
  };
}

function mapPermissionToForm(permission: PermissionRecord): PermissionForm {
  return {
    code: permission.code,
    displayName: permission.displayName,
    description: permission.description ?? "",
  };
}

function mapCommunityToForm(community: CommunityRecord): CommunityForm {
  return {
    code: community.code,
    displayName: community.displayName,
    description: community.description ?? "",
    status: community.status,
  };
}

function matchesSearch(values: Array<string | null | undefined>, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => (value ?? "").toLowerCase().includes(normalized));
}

export function AccessWorkspace() {
  const { hasAnyPermission, apiJson } = useSession();
  const canReadUsers = hasAnyPermission("users.read");
  const canWriteUsers = hasAnyPermission("users.write");
  const canReadRoles = hasAnyPermission("roles.read");
  const canWriteRoles = hasAnyPermission("roles.write");
  const canReadPermissions = hasAnyPermission("permissions.read");
  const canWritePermissions = hasAnyPermission("permissions.write");
  const canReadCommunities = hasAnyPermission("communities.read");
  const canWriteCommunities = hasAnyPermission("communities.write");

  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [activeTab, setActiveTab] = useState<AccessTab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [activePermissionId, setActivePermissionId] = useState<string | null>(null);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [userSummary, setUserSummary] = useState<AccessSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);

  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyRoleForm);
  const [permissionForm, setPermissionForm] = useState<PermissionForm>(emptyPermissionForm);
  const [communityForm, setCommunityForm] = useState<CommunityForm>(emptyCommunityForm);

  const [assignRoleId, setAssignRoleId] = useState("");
  const [assignRoleBranchId, setAssignRoleBranchId] = useState("");
  const [assignPermissionToRoleId, setAssignPermissionToRoleId] = useState("");
  const [assignPermissionToCommunityId, setAssignPermissionToCommunityId] = useState("");
  const [assignCommunityId, setAssignCommunityId] = useState("");
  const [assignBranchScopeId, setAssignBranchScopeId] = useState("");
  const [assignBranchScopeType, setAssignBranchScopeType] = useState<"member" | "manager" | "admin">("member");

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesSearch([user.displayName, user.email, user.status], searchQuery)),
    [searchQuery, users],
  );
  const filteredRoles = useMemo(
    () => roles.filter((role) => matchesSearch([role.displayName, role.code, role.description], searchQuery)),
    [roles, searchQuery],
  );
  const filteredPermissions = useMemo(
    () => permissions.filter((permission) => matchesSearch([permission.displayName, permission.code, permission.description], searchQuery)),
    [permissions, searchQuery],
  );
  const filteredCommunities = useMemo(
    () => communities.filter((community) => matchesSearch([community.displayName, community.code, community.description], searchQuery)),
    [communities, searchQuery],
  );

  const activeUser = useMemo(() => users.find((record) => record.id === activeUserId) ?? null, [activeUserId, users]);
  const activeRole = useMemo(() => roles.find((record) => record.id === activeRoleId) ?? null, [activeRoleId, roles]);
  const activePermission = useMemo(
    () => permissions.find((record) => record.id === activePermissionId) ?? null,
    [activePermissionId, permissions],
  );
  const activeCommunity = useMemo(
    () => communities.find((record) => record.id === activeCommunityId) ?? null,
    [activeCommunityId, communities],
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [branchRecords, userRecords, roleRecords, permissionRecords, communityRecords] = await Promise.all([
        hasAnyPermission("branches.read") ? apiJson<BranchRecord[]>("/branches") : Promise.resolve([]),
        canReadUsers ? apiJson<UserRecord[]>("/users") : Promise.resolve([]),
        canReadRoles ? apiJson<RoleRecord[]>("/roles") : Promise.resolve([]),
        canReadPermissions ? apiJson<PermissionRecord[]>("/permissions") : Promise.resolve([]),
        canReadCommunities ? apiJson<CommunityRecord[]>("/communities") : Promise.resolve([]),
      ]);
      setBranches(branchRecords);
      setUsers(userRecords);
      setRoles(roleRecords);
      setPermissions(permissionRecords);
      setCommunities(communityRecords);
      setActiveUserId((current) => current ?? userRecords[0]?.id ?? null);
      setActiveRoleId((current) => current ?? roleRecords[0]?.id ?? null);
      setActivePermissionId((current) => current ?? permissionRecords[0]?.id ?? null);
      setActiveCommunityId((current) => current ?? communityRecords[0]?.id ?? null);
      if (!showCreateUser && userRecords[0]) {
        setUserForm(mapUserToForm(userRecords[0]));
      }
      if (!showCreateRole && roleRecords[0]) {
        setRoleForm(mapRoleToForm(roleRecords[0]));
      }
      if (!showCreatePermission && permissionRecords[0]) {
        setPermissionForm(mapPermissionToForm(permissionRecords[0]));
      }
      if (!showCreateCommunity && communityRecords[0]) {
        setCommunityForm(mapCommunityToForm(communityRecords[0]));
      }
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Usuários e acessos não puderam ser carregados.");
    } finally {
      setLoading(false);
    }
  }, [
    apiJson,
    canReadCommunities,
    canReadPermissions,
    canReadRoles,
    canReadUsers,
    hasAnyPermission,
    showCreateCommunity,
    showCreatePermission,
    showCreateRole,
    showCreateUser,
  ]);

  const loadUserSummary = useCallback(
    async (userId: string) => {
      if (!canReadUsers) return;
      setSummaryLoading(true);
      try {
        const summary = await apiJson<AccessSummary>(`/users/${userId}/access-summary`);
        setUserSummary(summary);
      } catch (error) {
        setUserSummary(null);
        setMessage(error instanceof Error ? error.message : "O resumo de acesso não pôde ser carregado.");
      } finally {
        setSummaryLoading(false);
      }
    },
    [apiJson, canReadUsers],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadWorkspace]);

  useEffect(() => {
    if (!activeUser || showCreateUser) return;
    const timeoutId = window.setTimeout(() => {
      void loadUserSummary(activeUser.id);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [activeUser, loadUserSummary, showCreateUser]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteUsers) return;
    setSaving(true);
    setMessage(null);
    try {
      const created = await apiJson<UserRecord>("/users", {
        method: "POST",
        body: JSON.stringify({
          email: userForm.email,
          displayName: userForm.displayName,
          password: userForm.password,
          defaultBranchId: userForm.defaultBranchId || undefined,
        }),
      });
      setUsers((current) => [...current, created].sort((left, right) => left.displayName.localeCompare(right.displayName)));
      setActiveUserId(created.id);
      setShowCreateUser(false);
      setUserForm(mapUserToForm(created));
      setMessage("Usuário criado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "O usuário não pôde ser criado.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteUsers || !activeUser) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiJson<UserRecord>(`/users/${activeUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          email: userForm.email,
          displayName: userForm.displayName,
          defaultBranchId: userForm.defaultBranchId || null,
          status: userForm.status,
        }),
      });
      setUsers((current) => current.map((record) => (record.id === updated.id ? updated : record)));
      setUserForm(mapUserToForm(updated));
      setMessage("Usuário atualizado com sucesso.");
      await loadUserSummary(updated.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "O usuário não pôde ser atualizado.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteRoles) return;
    setSaving(true);
    setMessage(null);
    try {
      const created = await apiJson<RoleRecord>("/roles", {
        method: "POST",
        body: JSON.stringify(roleForm),
      });
      setRoles((current) => [...current, created].sort((left, right) => left.displayName.localeCompare(right.displayName)));
      setActiveRoleId(created.id);
      setShowCreateRole(false);
      setRoleForm(mapRoleToForm(created));
      setMessage("Role criada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A role não pôde ser criada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteRoles || !activeRole) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiJson<RoleRecord>(`/roles/${activeRole.id}`, {
        method: "PATCH",
        body: JSON.stringify(roleForm),
      });
      setRoles((current) => current.map((record) => (record.id === updated.id ? updated : record)));
      setRoleForm(mapRoleToForm(updated));
      setMessage("Role atualizada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A role não pôde ser atualizada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWritePermissions) return;
    setSaving(true);
    setMessage(null);
    try {
      const created = await apiJson<PermissionRecord>("/permissions", {
        method: "POST",
        body: JSON.stringify(permissionForm),
      });
      setPermissions((current) => [...current, created].sort((left, right) => left.code.localeCompare(right.code)));
      setActivePermissionId(created.id);
      setShowCreatePermission(false);
      setPermissionForm(mapPermissionToForm(created));
      setMessage("Permissão criada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A permissão não pôde ser criada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWritePermissions || !activePermission) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiJson<PermissionRecord>(`/permissions/${activePermission.id}`, {
        method: "PATCH",
        body: JSON.stringify(permissionForm),
      });
      setPermissions((current) => current.map((record) => (record.id === updated.id ? updated : record)));
      setPermissionForm(mapPermissionToForm(updated));
      setMessage("Permissão atualizada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A permissão não pôde ser atualizada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCommunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteCommunities) return;
    setSaving(true);
    setMessage(null);
    try {
      const created = await apiJson<CommunityRecord>("/communities", {
        method: "POST",
        body: JSON.stringify(communityForm),
      });
      setCommunities((current) => [...current, created].sort((left, right) => left.displayName.localeCompare(right.displayName)));
      setActiveCommunityId(created.id);
      setShowCreateCommunity(false);
      setCommunityForm(mapCommunityToForm(created));
      setMessage("Community criada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A community não pôde ser criada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateCommunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteCommunities || !activeCommunity) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiJson<CommunityRecord>(`/communities/${activeCommunity.id}`, {
        method: "PATCH",
        body: JSON.stringify(communityForm),
      });
      setCommunities((current) => current.map((record) => (record.id === updated.id ? updated : record)));
      setCommunityForm(mapCommunityToForm(updated));
      setMessage("Community atualizada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A community não pôde ser atualizada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteUsers || !activeUser || !assignRoleId) return;
    setSaving(true);
    setMessage(null);
    try {
      await apiJson(`/users/${activeUser.id}/roles`, {
        method: "POST",
        body: JSON.stringify({ roleId: assignRoleId, assignedBranchId: assignRoleBranchId || undefined }),
      });
      setAssignRoleId("");
      setAssignRoleBranchId("");
      setMessage("Role vinculada ao usuário.");
      await loadUserSummary(activeUser.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A role não pôde ser vinculada.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignBranchScope(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteUsers || !activeUser || !assignBranchScopeId) return;
    setSaving(true);
    setMessage(null);
    try {
      await apiJson(`/users/${activeUser.id}/branch-scopes`, {
        method: "POST",
        body: JSON.stringify({ branchId: assignBranchScopeId, scopeType: assignBranchScopeType }),
      });
      setAssignBranchScopeId("");
      setAssignBranchScopeType("member");
      setMessage("Escopo de filial vinculado ao usuário.");
      await loadUserSummary(activeUser.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "O escopo de filial não pôde ser vinculado.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignCommunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteCommunities || !activeUser || !assignCommunityId) return;
    setSaving(true);
    setMessage(null);
    try {
      await apiJson(`/communities/${assignCommunityId}/users`, {
        method: "POST",
        body: JSON.stringify({ userId: activeUser.id }),
      });
      setAssignCommunityId("");
      setMessage("Community vinculada ao usuário.");
      await loadUserSummary(activeUser.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A community não pôde ser vinculada ao usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignPermissionToRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteRoles || !activeRole || !assignPermissionToRoleId) return;
    setSaving(true);
    setMessage(null);
    try {
      await apiJson(`/roles/${activeRole.id}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionId: assignPermissionToRoleId }),
      });
      setAssignPermissionToRoleId("");
      setMessage("Permissão vinculada à role.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A permissão não pôde ser vinculada à role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignPermissionToCommunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteCommunities || !activeCommunity || !assignPermissionToCommunityId) return;
    setSaving(true);
    setMessage(null);
    try {
      await apiJson(`/communities/${activeCommunity.id}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionId: assignPermissionToCommunityId }),
      });
      setAssignPermissionToCommunityId("");
      setMessage("Permissão vinculada à community.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "A permissão não pôde ser vinculada à community.");
    } finally {
      setSaving(false);
    }
  }

  const anyReadAccess = canReadUsers || canReadRoles || canReadPermissions || canReadCommunities;
  if (!anyReadAccess) {
    return (
      <section className="mini-card">
        <h3>Usuários e acessos indisponíveis</h3>
        <p>Você não possui acesso a este workspace no contexto atual.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero-card">
        <div className="eyebrow">Administração</div>
        <h1 className="title">Usuários e Acessos</h1>
        <p>Administre usuários, roles, permissions e communities sem sair do fluxo operacional.</p>
      </section>

      {message ? (
        <section className="mini-card">
          <p>{message}</p>
        </section>
      ) : null}

      <section className="mini-card">
        <div className="workspace-toolbar">
          <div className="workspace-toolbar__copy">
            <h3>Navegação operacional</h3>
            <p>Escolha o domínio de administração e trabalhe no mesmo contexto.</p>
          </div>
          <div className="button-row">
            {(["users", "roles", "permissions", "communities"] as AccessTab[]).map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "button" : "button-secondary"}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab === "users" ? "Usuários" : tab === "roles" ? "Roles" : tab === "permissions" ? "Permissions" : "Communities"}
              </button>
            ))}
          </div>
        </div>
        <div className="filters-grid">
          <label className="field">
            <span>Pesquisar</span>
            <input placeholder="Digite para localizar" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          </label>
        </div>
      </section>

      {activeTab === "users" ? (
        <section className="workspace-split">
          <article className="mini-card">
            <div className="workspace-toolbar">
              <div className="workspace-toolbar__copy">
                <h3>Usuários</h3>
                <p>{loading ? "Carregando…" : `${filteredUsers.length} registro(s)`}</p>
              </div>
              {canWriteUsers ? (
                <button
                  className="button"
                  onClick={() => {
                    setShowCreateUser(true);
                    setUserForm(emptyUserForm());
                  }}
                  type="button"
                >
                  Novo usuário
                </button>
              ) : null}
            </div>
            <ListTable
              columns={["Usuário", "Status", "Filial padrão"]}
              emptyMessage="Nenhum usuário encontrado."
              rows={filteredUsers.map((user) => ({
                id: user.id,
                active: user.id === activeUserId,
                cells: [
                  <div key={`${user.id}-summary`}>
                    <strong>{user.displayName}</strong>
                    <div className="table-subtle">{user.email}</div>
                  </div>,
                  <span key={`${user.id}-status`} className={`status-chip status-chip--${user.status === "inactive" ? "inactive" : "active"}`}>
                    {user.status}
                  </span>,
                  branches.find((branch) => branch.id === user.defaultBranchId)?.displayName ?? "—",
                ],
                onClick: () => {
                  setActiveUserId(user.id);
                  setShowCreateUser(false);
                  setUserForm(mapUserToForm(user));
                },
              }))}
            />
          </article>

          <article className="mini-card">
            <div className="workspace-toolbar__copy">
              <h3>{showCreateUser ? "Criar usuário" : "Visualizar / editar usuário"}</h3>
              <p>{showCreateUser ? "Cadastre o usuário e retorne ao mesmo fluxo." : "Visualize e ajuste o usuário selecionado."}</p>
            </div>

            {showCreateUser ? (
              <form className="form-grid" onSubmit={handleCreateUser}>
                <UserFormFields
                  branches={branches}
                  canQuickCreateBranch={hasAnyPermission("branches.write")}
                  form={userForm}
                  requirePassword
                  saving={saving}
                  setBranches={setBranches}
                  setForm={setUserForm}
                  setMessage={setMessage}
                />
                <div className="button-row">
                  <button className="button" disabled={saving} type="submit">
                    {saving ? "Salvando…" : "Salvar usuário"}
                  </button>
                  <button className="button-secondary" onClick={() => setShowCreateUser(false)} type="button">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : activeUser ? (
              <div className="detail-stack">
                <div className="detail-grid">
                  <div className="detail-field">
                    <span>ID</span>
                    <strong>{activeUser.id}</strong>
                  </div>
                  <div className="detail-field">
                    <span>Status</span>
                    <strong>{activeUser.status}</strong>
                  </div>
                  <div className="detail-field">
                    <span>Permissões efetivas</span>
                    <strong>{summaryLoading ? "Carregando…" : userSummary?.effectiveAccess.permissions.length ?? 0}</strong>
                  </div>
                </div>

                <form className="form-grid" onSubmit={handleUpdateUser}>
                  <UserFormFields
                    branches={branches}
                    canQuickCreateBranch={hasAnyPermission("branches.write")}
                    form={userForm}
                    saving={saving}
                    setBranches={setBranches}
                    setForm={setUserForm}
                    setMessage={setMessage}
                  />
                  <div className="button-row">
                    <button className="button" disabled={saving || !canWriteUsers} type="submit">
                      {saving ? "Salvando…" : "Salvar alterações"}
                    </button>
                  </div>
                </form>

                <div className="mini-section">
                  <h4>Vincular role</h4>
                  <form className="inline-form" onSubmit={handleAssignRole}>
                    <select value={assignRoleId} onChange={(event) => setAssignRoleId(event.target.value)}>
                      <option value="">Selecione a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.displayName}
                        </option>
                      ))}
                    </select>
                    <select value={assignRoleBranchId} onChange={(event) => setAssignRoleBranchId(event.target.value)}>
                      <option value="">Sem filial específica</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.displayName}
                        </option>
                      ))}
                    </select>
                    <button className="button-secondary" disabled={saving || !canWriteUsers} type="submit">
                      Vincular
                    </button>
                  </form>
                </div>

                <div className="mini-section">
                  <h4>Vincular escopo de filial</h4>
                  <form className="inline-form" onSubmit={handleAssignBranchScope}>
                    <select value={assignBranchScopeId} onChange={(event) => setAssignBranchScopeId(event.target.value)}>
                      <option value="">Selecione a filial</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.displayName}
                        </option>
                      ))}
                    </select>
                    <select value={assignBranchScopeType} onChange={(event) => setAssignBranchScopeType(event.target.value as "member" | "manager" | "admin")}>
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="button-secondary" disabled={saving || !canWriteUsers} type="submit">
                      Vincular
                    </button>
                  </form>
                </div>

                <div className="mini-section">
                  <h4>Vincular community</h4>
                  <form className="inline-form" onSubmit={handleAssignCommunity}>
                    <select value={assignCommunityId} onChange={(event) => setAssignCommunityId(event.target.value)}>
                      <option value="">Selecione a community</option>
                      {communities.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.displayName}
                        </option>
                      ))}
                    </select>
                    <button className="button-secondary" disabled={saving || !canWriteCommunities} type="submit">
                      Vincular
                    </button>
                  </form>
                </div>

                <div className="mini-section">
                  <h4>Resumo de acesso</h4>
                  {summaryLoading ? (
                    <div className="empty-state">Carregando resumo…</div>
                  ) : userSummary ? (
                    <div className="workspace-stack">
                      <TokenBlock title="Roles" values={userSummary.roles.map((item) => `${item.displayName}${item.assignedBranchLabel ? ` · ${item.assignedBranchLabel}` : ""}`)} />
                      <TokenBlock title="Communities" values={userSummary.communities.map((item) => item.displayName)} />
                      <TokenBlock title="Escopos de filial" values={userSummary.branchScopes.map((item) => `${item.branchLabel} · ${item.scopeType}`)} />
                      <TokenBlock title="Permissões efetivas" values={userSummary.effectiveAccess.permissions} />
                    </div>
                  ) : (
                    <div className="empty-state">Nenhum resumo disponível.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">Selecione um usuário para visualizar os detalhes.</div>
            )}
          </article>
        </section>
      ) : null}

      {activeTab === "roles" ? (
        <section className="workspace-split">
          <article className="mini-card">
            <div className="workspace-toolbar">
              <div className="workspace-toolbar__copy">
                <h3>Roles</h3>
                <p>{loading ? "Carregando…" : `${filteredRoles.length} registro(s)`}</p>
              </div>
              {canWriteRoles ? (
                <button
                  className="button"
                  onClick={() => {
                    setShowCreateRole(true);
                    setRoleForm(emptyRoleForm());
                  }}
                  type="button"
                >
                  Nova role
                </button>
              ) : null}
            </div>
            <ListTable
              columns={["Role", "Status", "Sistema"]}
              emptyMessage="Nenhuma role encontrada."
              rows={filteredRoles.map((role) => ({
                id: role.id,
                active: role.id === activeRoleId,
                cells: [
                  <div key={`${role.id}-summary`}>
                    <strong>{role.displayName}</strong>
                    <div className="table-subtle">{role.code}</div>
                  </div>,
                  <span key={`${role.id}-status`} className={`status-chip status-chip--${role.status}`}>
                    {role.status}
                  </span>,
                  role.isSystemManaged ? "Sim" : "Não",
                ],
                onClick: () => {
                  setActiveRoleId(role.id);
                  setShowCreateRole(false);
                  setRoleForm(mapRoleToForm(role));
                },
              }))}
            />
          </article>
          <article className="mini-card">
            {showCreateRole ? (
              <EntityForm
                form={
                  <>
                    <RoleFormFields form={roleForm} setForm={setRoleForm} />
                    <div className="button-row">
                      <button className="button" disabled={saving} type="submit">
                        {saving ? "Salvando…" : "Salvar role"}
                      </button>
                      <button className="button-secondary" onClick={() => setShowCreateRole(false)} type="button">
                        Cancelar
                      </button>
                    </div>
                  </>
                }
                onSubmit={handleCreateRole}
                title="Criar role"
              />
            ) : activeRole ? (
              <div className="detail-stack">
                <EntityForm
                  form={
                    <>
                      <RoleFormFields form={roleForm} setForm={setRoleForm} />
                      <div className="button-row">
                        <button className="button" disabled={saving || !canWriteRoles} type="submit">
                          {saving ? "Salvando…" : "Salvar alterações"}
                        </button>
                      </div>
                    </>
                  }
                  onSubmit={handleUpdateRole}
                  title="Visualizar / editar role"
                />
                <div className="mini-section">
                  <h4>Vincular permissão</h4>
                  <form className="inline-form" onSubmit={handleAssignPermissionToRole}>
                    <select value={assignPermissionToRoleId} onChange={(event) => setAssignPermissionToRoleId(event.target.value)}>
                      <option value="">Selecione a permissão</option>
                      {permissions.map((permission) => (
                        <option key={permission.id} value={permission.id}>
                          {permission.code}
                        </option>
                      ))}
                    </select>
                    <button className="button-secondary" disabled={saving || !canWriteRoles} type="submit">
                      Vincular
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="empty-state">Selecione uma role para visualizar os detalhes.</div>
            )}
          </article>
        </section>
      ) : null}

      {activeTab === "permissions" ? (
        <section className="workspace-split">
          <article className="mini-card">
            <div className="workspace-toolbar">
              <div className="workspace-toolbar__copy">
                <h3>Permissions</h3>
                <p>{loading ? "Carregando…" : `${filteredPermissions.length} registro(s)`}</p>
              </div>
              {canWritePermissions ? (
                <button
                  className="button"
                  onClick={() => {
                    setShowCreatePermission(true);
                    setPermissionForm(emptyPermissionForm());
                  }}
                  type="button"
                >
                  Nova permission
                </button>
              ) : null}
            </div>
            <ListTable
              columns={["Permission", "Nome"]}
              emptyMessage="Nenhuma permission encontrada."
              rows={filteredPermissions.map((permission) => ({
                id: permission.id,
                active: permission.id === activePermissionId,
                cells: [<div key={`${permission.id}-code`}><strong>{permission.code}</strong></div>, permission.displayName],
                onClick: () => {
                  setActivePermissionId(permission.id);
                  setShowCreatePermission(false);
                  setPermissionForm(mapPermissionToForm(permission));
                },
              }))}
            />
          </article>
          <article className="mini-card">
            {showCreatePermission ? (
              <EntityForm
                form={
                  <>
                    <PermissionFormFields form={permissionForm} setForm={setPermissionForm} />
                    <div className="button-row">
                      <button className="button" disabled={saving} type="submit">
                        {saving ? "Salvando…" : "Salvar permission"}
                      </button>
                      <button className="button-secondary" onClick={() => setShowCreatePermission(false)} type="button">
                        Cancelar
                      </button>
                    </div>
                  </>
                }
                onSubmit={handleCreatePermission}
                title="Criar permission"
              />
            ) : activePermission ? (
              <EntityForm
                form={
                  <>
                    <PermissionFormFields form={permissionForm} setForm={setPermissionForm} />
                    <div className="button-row">
                      <button className="button" disabled={saving || !canWritePermissions} type="submit">
                        {saving ? "Salvando…" : "Salvar alterações"}
                      </button>
                    </div>
                  </>
                }
                onSubmit={handleUpdatePermission}
                title="Visualizar / editar permission"
              />
            ) : (
              <div className="empty-state">Selecione uma permission para visualizar os detalhes.</div>
            )}
          </article>
        </section>
      ) : null}

      {activeTab === "communities" ? (
        <section className="workspace-split">
          <article className="mini-card">
            <div className="workspace-toolbar">
              <div className="workspace-toolbar__copy">
                <h3>Communities</h3>
                <p>{loading ? "Carregando…" : `${filteredCommunities.length} registro(s)`}</p>
              </div>
              {canWriteCommunities ? (
                <button
                  className="button"
                  onClick={() => {
                    setShowCreateCommunity(true);
                    setCommunityForm(emptyCommunityForm());
                  }}
                  type="button"
                >
                  Nova community
                </button>
              ) : null}
            </div>
            <ListTable
              columns={["Community", "Status"]}
              emptyMessage="Nenhuma community encontrada."
              rows={filteredCommunities.map((community) => ({
                id: community.id,
                active: community.id === activeCommunityId,
                cells: [
                  <div key={`${community.id}-summary`}>
                    <strong>{community.displayName}</strong>
                    <div className="table-subtle">{community.code}</div>
                  </div>,
                  <span key={`${community.id}-status`} className={`status-chip status-chip--${community.status}`}>
                    {community.status}
                  </span>,
                ],
                onClick: () => {
                  setActiveCommunityId(community.id);
                  setShowCreateCommunity(false);
                  setCommunityForm(mapCommunityToForm(community));
                },
              }))}
            />
          </article>
          <article className="mini-card">
            {showCreateCommunity ? (
              <EntityForm
                form={
                  <>
                    <CommunityFormFields form={communityForm} setForm={setCommunityForm} />
                    <div className="button-row">
                      <button className="button" disabled={saving} type="submit">
                        {saving ? "Salvando…" : "Salvar community"}
                      </button>
                      <button className="button-secondary" onClick={() => setShowCreateCommunity(false)} type="button">
                        Cancelar
                      </button>
                    </div>
                  </>
                }
                onSubmit={handleCreateCommunity}
                title="Criar community"
              />
            ) : activeCommunity ? (
              <div className="detail-stack">
                <EntityForm
                  form={
                    <>
                      <CommunityFormFields form={communityForm} setForm={setCommunityForm} />
                      <div className="button-row">
                        <button className="button" disabled={saving || !canWriteCommunities} type="submit">
                          {saving ? "Salvando…" : "Salvar alterações"}
                        </button>
                      </div>
                    </>
                  }
                  onSubmit={handleUpdateCommunity}
                  title="Visualizar / editar community"
                />
                <div className="mini-section">
                  <h4>Vincular permissão</h4>
                  <form className="inline-form" onSubmit={handleAssignPermissionToCommunity}>
                    <select value={assignPermissionToCommunityId} onChange={(event) => setAssignPermissionToCommunityId(event.target.value)}>
                      <option value="">Selecione a permissão</option>
                      {permissions.map((permission) => (
                        <option key={permission.id} value={permission.id}>
                          {permission.code}
                        </option>
                      ))}
                    </select>
                    <button className="button-secondary" disabled={saving || !canWriteCommunities} type="submit">
                      Vincular
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="empty-state">Selecione uma community para visualizar os detalhes.</div>
            )}
          </article>
        </section>
      ) : null}
    </>
  );
}

function EntityForm({
  title,
  onSubmit,
  form,
}: {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  form: ReactNode;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <div className="workspace-toolbar__copy">
        <h3>{title}</h3>
      </div>
      {form}
    </form>
  );
}

function ListTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: string[];
  rows: Array<{ id: string; active?: boolean; cells: ReactNode[]; onClick: () => void }>;
  emptyMessage: string;
}) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className={row.active ? "data-table__row--active" : undefined} key={row.id} onClick={row.onClick}>
              {row.cells.map((cell, index) => (
                <td key={`${row.id}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty-state">{emptyMessage}</div>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function TokenBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="mini-section">
      <h4>{title}</h4>
      {values.length > 0 ? (
        <div className="token-list">
          {values.map((value) => (
            <span className="token-pill" key={value}>
              {value}
            </span>
          ))}
        </div>
      ) : (
        <div className="empty-state">Nenhum vínculo encontrado.</div>
      )}
    </div>
  );
}

function UserFormFields({
  branches,
  canQuickCreateBranch,
  form,
  setForm,
  setBranches,
  setMessage,
  saving,
  requirePassword = false,
}: {
  branches: BranchRecord[];
  canQuickCreateBranch: boolean;
  form: UserForm;
  setForm: Dispatch<SetStateAction<UserForm>>;
  setBranches: Dispatch<SetStateAction<BranchRecord[]>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  saving: boolean;
  requirePassword?: boolean;
}) {
  const { apiJson } = useSession();
  const branchLookupOptions = useMemo<SmartLookupOption[]>(
    () =>
      branches.map((branch) => ({
        id: branch.id,
        label: branch.displayName,
        hint: `${branch.code} · ${branch.status}`,
      })),
    [branches],
  );

  return (
    <>
      <label className="field">
        <span>E-mail</span>
        <input required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
      </label>
      <label className="field">
        <span>Nome exibido</span>
        <input required value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
      </label>
      {requirePassword ? (
        <label className="field">
          <span>Senha inicial</span>
          <input
            minLength={8}
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>
      ) : null}
      <label className="field">
        <span>Status</span>
        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as UserForm["status"] }))}>
          <option value="active">Ativo</option>
          <option value="invited">Convidado</option>
          <option value="inactive">Inativo</option>
        </select>
      </label>
      <div className="field">
        <SmartLookup
          allowClear
          canCreate={canQuickCreateBranch}
          createLabel="Criar nova filial"
          disabled={saving}
          entityType="branches"
          label="Filial padrão"
          options={branchLookupOptions}
          value={form.defaultBranchId}
          onChange={(option) => setForm((current) => ({ ...current, defaultBranchId: option?.id ?? "" }))}
          renderQuickCreate={({ cancelCreate, completeCreate, initialValue }) => (
            <QuickCreateBranch
              apiJson={apiJson}
              initialValue={initialValue}
              onCancel={cancelCreate}
              onComplete={(created) => {
                setBranches((current) => [...current, created].sort((left, right) => left.displayName.localeCompare(right.displayName)));
                setMessage("Filial criada e selecionada automaticamente.");
                completeCreate({
                  id: created.id,
                  label: created.displayName,
                  hint: `${created.code} · ${created.status}`,
                });
              }}
              setMessage={setMessage}
            />
          )}
        />
      </div>
    </>
  );
}

function QuickCreateBranch({
  apiJson,
  initialValue,
  onCancel,
  onComplete,
  setMessage,
}: {
  apiJson: ReturnType<typeof useSession>["apiJson"];
  initialValue: string;
  onCancel: () => void;
  onComplete: (branch: BranchRecord) => void;
  setMessage: Dispatch<SetStateAction<string | null>>;
}) {
  const [code, setCode] = useState(initialValue.slice(0, 12).toUpperCase());
  const [displayName, setDisplayName] = useState(initialValue);
  const [legalName, setLegalName] = useState(initialValue);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="form-grid"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          const created = await apiJson<BranchRecord>("/branches", {
            method: "POST",
            body: JSON.stringify({ code, displayName, legalName }),
          });
          onComplete(created);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "A filial não pôde ser criada.");
        } finally {
          setPending(false);
        }
      }}
    >
      <h4>Quick create</h4>
      <label className="field">
        <span>Código</span>
        <input required value={code} onChange={(event) => setCode(event.target.value)} />
      </label>
      <label className="field">
        <span>Nome exibido</span>
        <input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </label>
      <label className="field">
        <span>Razão social</span>
        <input required value={legalName} onChange={(event) => setLegalName(event.target.value)} />
      </label>
      <div className="button-row">
        <button className="button" disabled={pending} type="submit">
          {pending ? "Salvando…" : "Salvar e selecionar"}
        </button>
        <button className="button-secondary" onClick={onCancel} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function RoleFormFields({ form, setForm }: { form: RoleForm; setForm: Dispatch<SetStateAction<RoleForm>> }) {
  return (
    <>
      <label className="field">
        <span>Código</span>
        <input required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
      </label>
      <label className="field">
        <span>Nome exibido</span>
        <input required value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
      </label>
      <label className="field">
        <span>Status</span>
        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RoleForm["status"] }))}>
          <option value="active">Ativa</option>
          <option value="inactive">Inativa</option>
        </select>
      </label>
      <label className="field field--checkbox">
        <span>System managed</span>
        <input checked={form.isSystemManaged} onChange={(event) => setForm((current) => ({ ...current, isSystemManaged: event.target.checked }))} type="checkbox" />
      </label>
    </>
  );
}

function PermissionFormFields({
  form,
  setForm,
}: {
  form: PermissionForm;
  setForm: Dispatch<SetStateAction<PermissionForm>>;
}) {
  return (
    <>
      <label className="field">
        <span>Código</span>
        <input required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
      </label>
      <label className="field">
        <span>Nome exibido</span>
        <input required value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
      </label>
    </>
  );
}

function CommunityFormFields({
  form,
  setForm,
}: {
  form: CommunityForm;
  setForm: Dispatch<SetStateAction<CommunityForm>>;
}) {
  return (
    <>
      <label className="field">
        <span>Código</span>
        <input required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
      </label>
      <label className="field">
        <span>Nome exibido</span>
        <input required value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
      </label>
      <label className="field">
        <span>Status</span>
        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CommunityForm["status"] }))}>
          <option value="active">Ativa</option>
          <option value="inactive">Inativa</option>
        </select>
      </label>
    </>
  );
}
