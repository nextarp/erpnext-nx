// Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("Incident", {
	setup: function (frm) {
		const map_settings = frappe.provide("frappe.utils.map_defaults");
		map_settings.center = [51.86302, 4.54776];
		map_settings.zoom = 7.5;
		frappe.call({
			method: "erpnext.projects.doctype.incident.incident.get_employee_from_current_user",
			callback: function (r) {
				if (r.message) {
					frm.set_value("employee", r.message);
				}
			}
		});
	},
});
