import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

export function adminNavBackToDashboard(locale: AdminLocale): string {
  return locale === 'zh' ? '← 仪表板' : '← Дашборд';
}

function pick(locale: AdminLocale, ru: string, zh: string): string {
  return locale === 'zh' ? zh : ru;
}

export function adminStaffPage(locale: AdminLocale) {
  return {
    title: pick(locale, 'Сотрудники', '员工'),
    lead: pick(
      locale,
      'Учётные записи модераторов: email, доступ к разделам, активация.',
      '版主账号：邮箱、分区权限与启用状态。',
    ),
    addStaff: pick(locale, 'Добавить сотрудника', '添加员工'),
    save: pick(locale, 'Сохранить', '保存'),
    cancel: pick(locale, 'Отмена', '取消'),
    resetPassword: pick(locale, 'Сбросить пароль', '重置密码'),
    deactivate: pick(locale, 'Деактивировать', '停用'),
    activate: pick(locale, 'Активировать', '启用'),
    sectionsHeading: pick(locale, 'Разделы админки', '后台分区'),
    selectAll: pick(locale, 'Выбрать все', '全选'),
    clearAll: pick(locale, 'Снять все', '全不选'),
    email: pick(locale, 'Email', '邮箱'),
    displayName: pick(locale, 'Имя в админке', '显示名称'),
    role: pick(locale, 'Роль', '角色'),
    status: pick(locale, 'Статус', '状态'),
    lastLogin: pick(locale, 'Последний вход', '上次登录'),
    active: pick(locale, 'Активен', '启用'),
    inactive: pick(locale, 'Деактивирован', '停用'),
    superAdmin: pick(locale, 'Суперадмин', '超级管理员'),
    moderator: pick(locale, 'Сотрудник', '员工'),
    passwordTitle: pick(locale, 'Пароль отправлен', '密码已发送'),
    passwordHint: pick(
      locale,
      'Временный пароль отправлен на email сотрудника. Повторно он не отображается в системе.',
      '临时密码已发送至员工邮箱，系统内不会再次显示。',
    ),
    passwordEmailSent: pick(locale, 'Письмо с паролем отправлено на email.', '登录密码已发送至邮箱。'),
    passwordEmailFailed: pick(
      locale,
      'Сотрудник создан, но письмо не отправилось. Сбросьте пароль позже или свяжитесь с IT.',
      '员工已创建，但邮件未发送。请稍后重置密码或联系技术支持。',
    ),
    copyPassword: pick(locale, 'Скопировать', '复制'),
    copied: pick(locale, 'Скопировано', '已复制'),
    close: pick(locale, 'Закрыть', '关闭'),
    neverLoggedIn: pick(locale, 'Ещё не входил', '尚未登录'),
    errLoad: pick(locale, 'Не удалось загрузить список сотрудников', '无法加载员工列表'),
    errSave: pick(locale, 'Не удалось сохранить', '保存失败'),
    errCreate: pick(locale, 'Не удалось создать сотрудника', '创建失败'),
    errPassword: pick(locale, 'Не удалось сбросить пароль', '重置密码失败'),
    createSuccess: pick(locale, 'Сотрудник создан', '员工已创建'),
    saveSuccess: pick(locale, 'Изменения сохранены', '已保存'),
    activateSuccess: pick(locale, 'Сотрудник активирован', '员工已启用'),
    deactivateSuccess: pick(locale, 'Сотрудник деактивирован', '员工已停用'),
    avatarSuccess: pick(locale, 'Аватар обновлён', '头像已更新'),
    resetPasswordSuccess: pick(locale, 'Пароль сброшен', '密码已重置'),
    passwordRetrySend: pick(locale, 'Повторить отправку', '重试发送'),
    passwordRetryHint: pick(
      locale,
      'Письмо не дошло — нажмите «Повторить отправку» или сбросьте пароль вручную позже.',
      '邮件未送达 — 请点击「重试发送」，或稍后手动重置密码。',
    ),
    deactivateConfirmTitle: pick(locale, 'Деактивировать сотрудника?', '停用该员工？'),
    deactivateConfirmMessage: pick(
      locale,
      'Сотрудник не сможет войти в админку до повторной активации.',
      '该员工将无法登录后台，直至重新启用。',
    ),
    emptyList: pick(locale, 'Сотрудников пока нет', '暂无员工'),
    avatar: pick(locale, 'Аватар', '头像'),
    avatarHint: pick(locale, 'JPEG, PNG или WebP, до 2 МБ', 'JPEG、PNG 或 WebP，最大 2 MB'),
    errAvatar: pick(locale, 'Не удалось загрузить аватар', '头像上传失败'),
  };
}

export function adminStaffMePage(locale: AdminLocale) {
  const base = adminStaffPage(locale);
  return {
    ...base,
    pageTitle: pick(locale, 'Мой профиль', '我的资料'),
    title: pick(locale, 'Профиль', '资料'),
  };
}

export function formatStaffLastLogin(iso: string | null, locale: AdminLocale, neverLabel: string): string {
  if (!iso) return neverLabel;
  try {
    return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'ru-RU');
  } catch {
    return neverLabel;
  }
}
