
# 🎨 MarketScout SEO UI Style Guide

This guide establishes a consistent visual language and design system for the MarketScout SEO Supertool.

---

## 1. Branding & Identity

| Element             | Value                                |
|---------------------|---------------------------------------|
| **Product Name**     | MarketScout SEO                      |
| **Primary Font**     | Inter (fallback: system-ui, sans-serif) |
| **Font Weights**     | 400 (regular), 500 (medium), 700 (bold) |
| **Corner Radius**    | 2xl (`1rem` or `16px`)               |
| **Shadow Style**     | `shadow-md` or Tailwind `shadow-xl`  |
| **Border Style**     | Subtle (`border`, `border-gray-200`) |
| **Spacing System**   | Tailwind spacing scale (`p-2`, `px-4`, `gap-6`) |

---

## 2. Color Palette

| Purpose               | Color Code   | Tailwind Equivalent |
|------------------------|--------------|----------------------|
| **Primary (Accent)**    | `#6366F1`    | `indigo-500`         |
| **Primary Hover**       | `#4F46E5`    | `indigo-600`         |
| **Secondary (Info)**    | `#3B82F6`    | `blue-500`           |
| **Success**             | `#10B981`    | `green-500`          |
| **Warning**             | `#F59E0B`    | `yellow-500`         |
| **Error**               | `#EF4444`    | `red-500`            |
| **Gray (Text Base)**    | `#6B7280`    | `gray-500`           |
| **Gray (Background)**   | `#F9FAFB`    | `gray-50`            |
| **White**               | `#FFFFFF`    | `white`              |
| **Black**               | `#111827`    | `gray-900`           |

---

## 3. Typography System

| Use Case             | Font Size | Weight | Tailwind Class |
|----------------------|-----------|--------|----------------|
| **H1 (Main Titles)**  | `32px`    | 700    | `text-3xl font-bold` |
| **H2 (Subheadings)**  | `24px`    | 600    | `text-2xl font-semibold` |
| **H3 (Card Titles)**  | `20px`    | 600    | `text-xl font-semibold` |
| **Body Text**         | `16px`    | 400    | `text-base`     |
| **Small Labels**      | `14px`    | 500    | `text-sm font-medium` |

---

## 4. Components & UI Elements

### ✅ Buttons

| Variant     | Tailwind Classes |
|-------------|------------------|
| **Primary** | `bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-2xl shadow` |
| **Secondary** | `border border-gray-300 text-gray-700 hover:bg-gray-100 py-2 px-4 rounded-2xl` |
| **Danger**   | `bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-2xl` |

### ✅ Cards

- `rounded-2xl bg-white shadow-md p-6 flex flex-col gap-2`

### ✅ Tabs / Navigation

- Sidebar: `w-64 bg-white border-r border-gray-200 p-4`
- Active Tab: `text-indigo-600 font-semibold border-l-4 border-indigo-600 bg-indigo-50`
- Inactive Tab: `text-gray-700 hover:text-indigo-600 hover:bg-gray-50`

### ✅ Tables

- `w-full border-collapse`
- Header: `bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider`
- Row: `hover:bg-gray-50 even:bg-white odd:bg-gray-50 text-sm text-gray-700`

---

## 5. Icons

- Library: [Lucide Icons](https://lucide.dev/) (preferred) or Heroicons
- Size: `w-5 h-5` standard
- Icon Color: inherit from text color (e.g., `text-gray-500`, `text-indigo-600`)

---

## 6. Status Indicators

| Status    | Style                                |
|-----------|---------------------------------------|
| ✅ Success | `text-green-600`, `bg-green-50` badge |
| ⚠️ Warning | `text-yellow-600`, `bg-yellow-50` badge |
| ❌ Error   | `text-red-600`, `bg-red-50` badge     |
| ℹ️ Info    | `text-blue-600`, `bg-blue-50` badge   |

---

## 7. Forms & Inputs

| Element     | Classes |
|-------------|---------|
| **Input**     | `border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500` |
| **Dropdown**  | `rounded-md border border-gray-300 bg-white shadow-sm focus:ring-indigo-500` |
| **Textarea**  | `resize rounded-md border px-3 py-2 shadow-sm w-full` |
| **Toggle Switch** | `flex items-center gap-2 text-sm` + `peer` class logic for accessibility |

---

## 8. Modal / Dialogs

- Wrapper: `fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50`
- Modal: `bg-white rounded-2xl p-6 shadow-xl w-full max-w-xl`
