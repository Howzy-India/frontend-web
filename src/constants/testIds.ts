/**
 * Centralized data-testid constants for Playwright/automation testing.
 * Usage: <button data-testid={TEST_IDS.LOGIN.SEND_OTP_BTN}>
 */

export const TEST_IDS = {
  // ─── App-level ────────────────────────────────────────────────────────────
  APP: {
    CONTAINER: 'app-container',
    LOGOUT_BANNER: 'logout-banner',
    SPLASH_SCREEN: 'splash-screen',
    PAGE_TRANSITION: 'page-transition',
    LOGIN_MODAL_OVERLAY: 'login-modal-overlay',
  },

  // ─── Login modal ──────────────────────────────────────────────────────────
  LOGIN: {
    MODAL: 'login-modal',
    CLOSE_BTN: 'login-close-btn',
    PHONE_INPUT: 'login-phone-input',
    SEND_OTP_BTN: 'login-send-otp-btn',
    OTP_BOX: (i: number) => `login-otp-box-${i}` as const,
    VERIFY_OTP_BTN: 'login-verify-otp-btn',
    BACK_RESEND_BTN: 'login-back-resend-btn',
    ERROR_BANNER: 'login-error-banner',
  },

  // ─── Client signup modal ──────────────────────────────────────────────────
  SIGNUP: {
    MODAL: 'signup-modal',
    NAME_INPUT: 'signup-name-input',
    EMAIL_INPUT: 'signup-email-input',
    LOOKING_FOR_OPTION: (type: string) => `signup-looking-for-${type.replace(/\s+/g, '-').toLowerCase()}` as const,
    LOOKING_FOR_CONTAINER: 'signup-looking-for-container',
    CONTACT_TIME_SELECT: 'signup-contact-time',
    SUBMIT_BTN: 'signup-submit-btn',
    ERROR_MSG: 'signup-error-msg',
    SUCCESS_SCREEN: 'signup-success-screen',
    SUCCESS_ICON: 'signup-success-icon',
    LOADING_SPINNER: 'signup-loading-spinner',
  },

  // ─── Client profile edit modal ────────────────────────────────────────────
  PROFILE_EDIT: {
    MODAL: 'profile-edit-modal',
    CLOSE_BTN: 'profile-edit-close-btn',
    NAME_INPUT: 'profile-edit-name-input',
    NAME_ERROR: 'profile-edit-name-error',
    CONTACT_TIME_SELECT: 'profile-edit-contact-time',
    CONTACT_ERROR: 'profile-edit-contact-error',
    ERROR_MSG: 'profile-edit-error-msg',
    SUCCESS_ICON: 'profile-edit-success-icon',
    CANCEL_BTN: 'profile-edit-cancel-btn',
    SAVE_BTN: 'profile-edit-save-btn',
  },

  // ─── Client portal ────────────────────────────────────────────────────────
  PORTAL: {
    CONTAINER: 'client-portal-container',
    CITY_SELECT: 'portal-city-select',
    SEARCH_INPUT: 'portal-search-input',
    CONTACT_US_BTN: 'portal-contact-us-btn',
    LOGIN_BTN: 'portal-login-btn',

    NAV_TAB: (tab: string) => `nav-tab-${tab.toLowerCase().replace(/\s+/g, '-')}` as const,
    CATEGORY_FILTER: (cat: string) => `category-filter-${cat.toLowerCase().replace(/\s+/g, '-')}` as const,

    NOTIFICATIONS_BELL: 'portal-notifications-bell',
    NOTIFICATIONS_PANEL: 'portal-notifications-panel',
    NOTIFICATIONS_MARK_ALL_READ: 'portal-mark-all-read-btn',
    NOTIFICATION_ITEM: (id: string) => `notification-item-${id}` as const,

    AVATAR_MENU_BTN: 'portal-avatar-menu-btn',
    AVATAR_MENU_PANEL: 'portal-avatar-menu-panel',
    AVATAR_EDIT_PROFILE_BTN: 'portal-edit-profile-btn',
    AVATAR_LOGOUT_BTN: 'portal-avatar-logout-btn',

    DASHBOARD_TAB: (tab: string) => `dashboard-tab-${tab.toLowerCase().replace(/\s+/g, '-')}` as const,
    PROPERTY_CARD: (id: string) => `property-card-${id}` as const,
    SAVE_PROPERTY_BTN: (id: string) => `save-property-btn-${id}` as const,
    ENQUIRY_BTN: (id: string) => `enquiry-btn-${id}` as const,

    RESALE_SUBMIT_MODAL: 'resale-submit-modal',
    RESALE_FORM_TITLE: 'resale-form-title-input',
    RESALE_FORM_TYPE: 'resale-form-type-select',
    RESALE_FORM_PRICE: 'resale-form-price-input',
    RESALE_FORM_CITY: 'resale-form-city-input',
    RESALE_FORM_LOCATION: 'resale-form-location-input',
    RESALE_FORM_AREA: 'resale-form-area-input',
    RESALE_FORM_BEDROOMS: 'resale-form-bedrooms-input',
    RESALE_FORM_BATHROOMS: 'resale-form-bathrooms-input',
    RESALE_FORM_DESC: 'resale-form-description-textarea',
    RESALE_FORM_SUBMIT: 'resale-form-submit-btn',
    RESALE_FORM_CANCEL: 'resale-form-cancel-btn',
  },

  // ─── Client login dashboard ───────────────────────────────────────────────
  LOGIN_DASHBOARD: {
    CONTAINER: 'client-login-dashboard',
    REFRESH_BTN: 'refresh-data-btn',
    SEARCH_INPUT: 'login-dashboard-search',
    STATUS_FILTER: 'status-filter-select',
    DEVICE_FILTER: 'device-filter-select',
    METRIC_CARD: (key: string) => `metric-${key}` as const,
    TABLE: 'login-history-table',
    ROW: (id: string) => `login-row-${id}` as const,
    VIEW_360_BTN: (id: string) => `user-360-view-btn-${id}` as const,
    MODAL_360: 'modal-360-view',
    MODAL_360_CLOSE: 'modal-360-close-btn',
  },

  // ─── Client registrations panel ───────────────────────────────────────────
  REGISTRATIONS: {
    CONTAINER: 'client-registrations-panel',
    SEARCH_INPUT: 'registrations-search-input',
    TABLE: 'registrations-table',
    ROW: (uid: string) => `registration-row-${uid}` as const,
    ROW_EXPAND_BTN: (uid: string) => `registration-row-expand-${uid}` as const,
    ROW_EXPANDED: (uid: string) => `registration-row-expanded-${uid}` as const,
    DELETE_BTN: (uid: string) => `delete-client-btn-${uid}` as const,
    DELETE_CONFIRM_MODAL: 'delete-confirm-modal',
    DELETE_CONFIRM_BTN: 'delete-modal-confirm-btn',
    DELETE_CANCEL_BTN: 'delete-modal-cancel-btn',
    DELETE_CONFIRM_MSG: 'delete-confirm-message',
  },

  // ─── Super admin dashboard ────────────────────────────────────────────────
  SUPER_ADMIN: {
    CONTAINER: 'super-admin-dashboard',
    SIDEBAR: 'admin-sidebar',
    SIDEBAR_TOGGLE: 'sidebar-toggle-mobile',
    SIDEBAR_LOGO: 'sidebar-logo',
    NAV_GROUP: (label: string) => `nav-group-${label.toLowerCase().replace(/\s+/g, '-')}` as const,
    NAV_TAB: (id: string) => `admin-nav-tab-${id}` as const,
    SIDEBAR_USER_INFO: 'sidebar-user-info',
    LOGOUT_BTN: 'admin-logout-btn',
    HEADER: 'admin-header',
    PAGE_TITLE: 'page-title',
    SEARCH_INPUT: 'admin-search-input',
    CONTENT_AREA: 'admin-content-area',
    NOTIFICATIONS_BELL: 'admin-notifications-bell',
    NOTIFICATIONS_PANEL: 'admin-notifications-panel',
    NOTIFICATIONS_MARK_ALL_READ: 'notifications-mark-all-read',
    NOTIFICATION_ITEM: (id: string) => `admin-notification-item-${id}` as const,

    RESALE_ADD_TOGGLE: 'resale-add-form-toggle',
    RESALE_TITLE_INPUT: 'add-resale-title',
    RESALE_TYPE_SELECT: 'add-resale-type',
    RESALE_PRICE_INPUT: 'add-resale-price',
    RESALE_CITY_INPUT: 'add-resale-city',
    RESALE_LOCATION_INPUT: 'add-resale-location',
    RESALE_AREA_INPUT: 'add-resale-area',
    RESALE_BEDROOMS_INPUT: 'add-resale-bedrooms',
    RESALE_BATHROOMS_INPUT: 'add-resale-bathrooms',
    RESALE_DESC_TEXTAREA: 'add-resale-description',
    RESALE_SUBMIT_BTN: 'add-resale-submit-btn',
    RESALE_CANCEL_BTN: 'add-resale-cancel-btn',
    RESALE_STATUS_FILTER: 'resale-status-filter',
    RESALE_CITY_FILTER: 'resale-city-filter',
  },
} as const;
