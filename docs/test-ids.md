# Element ids for automated tests

Every element a test needs to touch carries a stable `id`, so Selenium (`By.id`), Robot Framework
(`id=…`), Playwright (`#…`) and Cypress (`cy.get("#…")`) can all locate it directly.

**Rules the ids follow**

- kebab-case, prefixed by the screen or component (`bug-`, `filter-`, `nav-`, `project-`…)
- one id per element, unique on every screen — verified across all 11 screens
- ids built from data use the business key, never a Mongo id: `bug-card-WEB-0001`, `project-APP`
- ids are part of the contract. Renaming one breaks tests, so treat it like an API change.

## Custom dropdowns — two steps

The app uses a custom dropdown (not a native `<select>`), so a test **clicks the trigger, then
clicks the option**:

```python
driver.find_element(By.ID, "bug-severity").click()              # open
driver.find_element(By.ID, "bug-severity-option-blocker").click()  # choose
```

Option ids are `<dropdown-id>-option-<slug>`, where the slug is the lowercased value with
non-alphanumerics turned into dashes (`In Progress` → `in-progress`, `UI/UX` → `ui-ux`,
`Not specified` → `any`). Dropdowns whose values are database ids use a readable slug instead:
`bug-project-option-web`, `bug-assignee-option-rita-reporter`.

The trigger also exposes `data-value` with the current value, so you can assert selection without
reading the label.

## Login / Register / Account

| id | Element |
|---|---|
| `login-email`, `login-password`, `login-submit` | login form |
| `login-error` | error message (only when login fails) |
| `login-register-link` | link to the register page |
| `register-name`, `register-email`, `register-password`, `register-submit`, `register-error` | register form |
| `account-name`, `account-email`, `account-role` | the signed-in user's details |
| `account-current-password`, `account-new-password`, `account-submit` | change-password form |
| `account-error`, `account-success` | result messages |

## Navigation (every signed-in page)

`nav-logo` · `nav-dashboard` · `nav-bugs` · `nav-insights`\* · `nav-projects`\* · `nav-team`\* ·
`nav-report-bug` · `nav-account` · `nav-logout`

`notification-bell` · `notification-badge` (unread count, absent when zero) · `notification-panel` ·
`notification-list` · `notification-item-<notificationId>` · `notification-mark-all` ·
`notification-empty`

\* only rendered for Head of QA / Admin — a good negative assertion for role tests.

## Dashboard

| id | Element |
|---|---|
| `dashboard-greeting` | "Hey <name> 👋" |
| `dashboard-role` | role badge (elevated only) |
| `dashboard-insights`, `dashboard-team` | shortcuts (elevated only) |
| `dashboard-report-bug`, `dashboard-see-all` | links |
| `triage-board-heading` | "Team triage board" vs "My triage board" |
| `triage-P0` … `triage-P4` | the level tiles (clicking filters the list) |
| `triage-count-P0` … `triage-count-P4` | the number on each tile |
| `dashboard-status-list`, `dashboard-status-<status-slug>` | status breakdown |
| `dashboard-type-list` | bug-type breakdown |
| `dashboard-recent-bugs`, `dashboard-empty` | recent bugs grid / empty state |

## Bug list

| id | Element |
|---|---|
| `bug-list-heading` | heading (differs by role) |
| `filter-search` | search box |
| `filter-project`, `filter-module`, `filter-status`, `filter-severity`, `filter-priority`, `filter-level`, `filter-type`, `filter-sort` | filter dropdowns |
| `active-filters`, `filter-chip-<key>`, `filter-chip-remove-<key>`, `clear-all-filters` | applied-filter chips |
| `bug-list`, `bug-list-loading`, `bug-list-empty` | results grid and its states |
| `bug-card-<BUG-ID>` | one card, e.g. `bug-card-WEB-0001` |
| `bug-card-id-<BUG-ID>`, `bug-card-title-<BUG-ID>` | the id and title inside a card |
| `bug-checkbox-<BUG-ID>` | selection checkbox (elevated only) |
| `bulk-bar`, `bulk-selected-count`, `bulk-status`, `bulk-assignee`, `bulk-delete`, `bulk-clear` | bulk action bar |
| `pagination-info`, `page-prev`, `page-next` | pagination |
| `export-csv`, `bug-list-report` | toolbar buttons |

## Report / edit bug

| id | Element |
|---|---|
| `bug-form`, `bug-form-heading`, `bug-submit`, `bug-form-error` | the form itself |
| `bug-project`, `bug-module` | project and the site/app inside it |
| `bug-module-empty` | shown instead of the dropdown when the project has no sites/apps |
| `bug-title`, `bug-description` | text fields |
| `bug-step-1`, `bug-step-2`, … | steps to reproduce (1-based) |
| `bug-add-step`, `bug-remove-step-<n>` | step controls |
| `bug-severity`, `bug-priority`, `bug-type`, `bug-assignee` | dropdowns |
| `bug-assignee-readonly` | plain text when the user may not reassign |
| `bug-triage-preview` | the auto-calculated P-level preview |
| `bug-status`, `bug-found-version`, `bug-fixed-version` | edit mode only |
| `file-dropzone`, `file-input`, `file-browse` | attachments — **send file paths to `file-input`** |
| `file-preview-list`, `file-preview-<n>`, `file-remove-<n>` | chosen files before submitting |

## Bug detail

| id | Element |
|---|---|
| `bug-detail-id`, `bug-detail-title` | bug id and title |
| `bug-detail-edit`, `bug-detail-delete` | actions (delete is elevated only) |
| `bug-detail-status`, `bug-detail-assignee` | inline dropdowns |
| `bug-detail-status-readonly`, `bug-detail-assignee-readonly` | shown when the user may not change them |
| `bug-detail-description`, `bug-detail-steps`, `bug-detail-step-<n>` | content |
| `bug-detail-project`, `bug-detail-module`, `bug-detail-found-version`, `bug-detail-fixed-version` | metadata |
| `bug-detail-attachments`, `attachment-<n>`, `attachment-link-<n>`, `attachment-delete-<n>` | attachments |
| `bug-detail-links`, `linked-bug-<BUG-ID>`, `link-remove-<BUG-ID>`, `bug-detail-links-empty` | linked bugs |
| `link-type`, `link-target`, `link-submit`, `link-error` | the link form |
| `bug-timeline`, `timeline-list`, `timeline-item-<id>`, `timeline-empty` | activity + comments |
| `comment-input`, `comment-submit` | new comment |
| `comment-body-<id>`, `comment-edit-<id>`, `comment-delete-<id>` | an existing comment |
| `comment-edit-input-<id>`, `comment-edit-save-<id>`, `comment-edit-cancel-<id>` | editing a comment |

## QA insights (elevated only)

| id | Element |
|---|---|
| `insights-heading`, `insights-toggle-tables`, `insights-tables` | page + data-table toggle |
| `insights-open-count` | the hero number |
| `insights-critical-value`, `insights-done-value`, `insights-unassigned-value` | KPI tiles |
| `chart-levels`, `chart-status`, `chart-type`, `chart-module`, `chart-assignee` | bar charts |
| `<chart-id>-row-<slug>` | one bar, e.g. `chart-levels-row-p0` — clicking filters the list |
| `<chart-id>-value-<slug>` | that bar's number, e.g. `chart-status-value-open` |
| `heat-<severity>-<priority>` | a heatmap cell, e.g. `heat-blocker-urgent` |

## Projects (elevated only)

| id | Element |
|---|---|
| `project-form`, `project-name`, `project-key`, `project-create`, `project-error` | create form |
| `project-<KEY>` | a project card, e.g. `project-WEB` |
| `project-key-<KEY>`, `project-name-<KEY>`, `project-archive-<KEY>` | inside a card |
| `module-input-<KEY>`, `module-add-<KEY>` | add a site/app |
| `module-<KEY>-<slug>`, `module-remove-<KEY>-<slug>` | e.g. `module-WEB-shop-site` |
| `version-input-<KEY>`, `version-add-<KEY>`, `version-<KEY>-<version>`, `version-remove-<KEY>-<version>` | versions |

## Team (elevated only)

| id | Element |
|---|---|
| `user-row-<userId>` | one row |
| `user-name-<userId>`, `user-email-<userId>` | their details |
| `user-role-<userId>` | role dropdown |
| `user-reset-password-<userId>` | reset button |
| `temp-password-panel`, `temp-password` | the generated password, shown once |

## Example (Selenium + Python)

```python
driver.get("http://localhost:5173/login")
driver.find_element(By.ID, "login-email").send_keys("qa@example.com")
driver.find_element(By.ID, "login-password").send_keys("password123")
driver.find_element(By.ID, "login-submit").click()

driver.find_element(By.ID, "nav-report-bug").click()
driver.find_element(By.ID, "bug-title").send_keys("Checkout button does nothing")

driver.find_element(By.ID, "bug-severity").click()
driver.find_element(By.ID, "bug-severity-option-critical").click()
driver.find_element(By.ID, "bug-priority").click()
driver.find_element(By.ID, "bug-priority-option-urgent").click()

# the app should now show the auto-calculated level
assert "P0" in driver.find_element(By.ID, "bug-triage-preview").text

driver.find_element(By.ID, "file-input").send_keys("/path/to/screenshot.png")
driver.find_element(By.ID, "bug-submit").click()

assert driver.find_element(By.ID, "bug-detail-title").text == "Checkout button does nothing"
```
