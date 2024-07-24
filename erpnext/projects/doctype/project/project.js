// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt
frappe.ui.form.on("Project", {
	setup(frm) {
		frm.make_methods = {
			Timesheet: () => {
				open_form(frm, "Timesheet", "Timesheet Detail", "time_logs");
			},
			"Purchase Order": () => {
				open_form(frm, "Purchase Order", "Purchase Order Item", "items");
			},
			"Purchase Receipt": () => {
				open_form(frm, "Purchase Receipt", "Purchase Receipt Item", "items");
			},
			"Purchase Invoice": () => {
				open_form(frm, "Purchase Invoice", "Purchase Invoice Item", "items");
			},
		};
	},
	onload: function (frm) {
		const so = frm.get_docfield("sales_order");
		so.get_route_options_for_new_doc = () => {
			if (frm.is_new()) return {};
			return {
				customer: frm.doc.customer,
				project_name: frm.doc.name,
			};
		};

		frm.set_query("user", "users", function () {
			return {
				query: "erpnext.projects.doctype.project.project.get_users_for_project",
			};
		});

		frm.set_query("department", function (doc) {
			return {
				filters: {
					company: doc.company,
				},
			};
		});

		// sales order
		frm.set_query("sales_order", function () {
			var filters = {
				project: ["in", frm.doc.__islocal ? [""] : [frm.doc.name, ""]],
			};

			if (frm.doc.customer) {
				filters["customer"] = frm.doc.customer;
			}

			return {
				filters: filters,
			};
		});

		frm.set_query("cost_center", () => {
			return {
				filters: {
					company: frm.doc.company,
				},
			};
		});
	},

	refresh: function (frm) {
		if (frm.doc.__islocal) {
			frm.web_link && frm.web_link.remove();
		} else {
			frm.add_web_link("/projects?project=" + encodeURIComponent(frm.doc.name));

			frm.trigger("show_dashboard");
		}
		frm.trigger("set_custom_buttons");

		get_ordered_items(frm);
		get_invoiced_items(frm);
		calculate_total_amount(frm);
		calculate_total_quantity(frm);
		calculate_remaining_qty(frm);
	},

	set_custom_buttons: function (frm) {
		if (!frm.is_new()) {
			frm.add_custom_button(
				__("Duplicate Project with Tasks"),
				() => {
					frm.events.create_duplicate(frm);
				},
				__("Actions")
			);

			frm.add_custom_button(
				__("Update Total Purchase Cost"),
				() => {
					frm.events.update_total_purchase_cost(frm);
				},
				__("Actions")
			);

			frm.trigger("set_project_status_button");

			if (frappe.model.can_read("Task")) {
				frm.add_custom_button(
					__("Gantt Chart"),
					function () {
						frappe.route_options = {
							project: frm.doc.name,
						};
						frappe.set_route("List", "Task", "Gantt");
					},
					__("View")
				);

				frm.add_custom_button(
					__("Kanban Board"),
					() => {
						frappe
							.call(
								"erpnext.projects.doctype.project.project.create_kanban_board_if_not_exists",
								{
									project: frm.doc.name,
								}
							)
							.then(() => {
								frappe.set_route("List", "Task", "Kanban", frm.doc.project_name);
							});
					},
					__("View")
				);
			}
		}
	},

	update_total_purchase_cost: function (frm) {
		frappe.call({
			method: "erpnext.projects.doctype.project.project.recalculate_project_total_purchase_cost",
			args: { project: frm.doc.name },
			freeze: true,
			freeze_message: __("Recalculating Purchase Cost against this Project..."),
			callback: function (r) {
				if (r && !r.exc) {
					frappe.msgprint(__("Total Purchase Cost has been updated"));
					frm.refresh();
				}
			},
		});
	},

	set_project_status_button: function (frm) {
		frm.add_custom_button(
			__("Set Project Status"),
			() => {
				let d = new frappe.ui.Dialog({
					title: __("Set Project Status"),
					fields: [
						{
							fieldname: "status",
							fieldtype: "Select",
							label: "Status",
							reqd: 1,
							options: "Completed\nCancelled",
						},
					],
					primary_action: function () {
						frm.events.set_status(frm, d.get_values().status);
						d.hide();
					},
					primary_action_label: __("Set Project Status"),
				}).show();
			},
			__("Actions")
		);
	},

	create_duplicate: function (frm) {
		return new Promise((resolve) => {
			frappe.prompt("Project Name", (data) => {
				frappe
					.xcall("erpnext.projects.doctype.project.project.create_duplicate_project", {
						prev_doc: frm.doc,
						project_name: data.value,
					})
					.then(() => {
						frappe.set_route("Form", "Project", data.value);
						frappe.show_alert(__("Duplicate project has been created"));
					});
				resolve();
			});
		});
	},

	set_status: function (frm, status) {
		frappe.confirm(__("Set Project and all Tasks to status {0}?", [status.bold()]), () => {
			frappe
				.xcall("erpnext.projects.doctype.project.project.set_project_status", {
					project: frm.doc.name,
					status: status,
				})
				.then(() => {
					frm.reload_doc();
				});
		});
	},
});

frappe.ui.form.on("Project Attachments", {
	custom_project_files_add: function (frm, cdt, cdn) {
		frappe.model.set_value(cdt, cdn, "uploaded_by", frappe.session.user);
		frappe.model.set_value(cdt, cdn, "uploaded_at", frappe.datetime.now_datetime());
	}
});

frappe.ui.form.on("Project Items", {
	item_code: function (frm, cdt, cdn) {
		var row = frappe.get_doc(cdt, cdn);
		if (row.item_code) {
			frappe.call({
				method: "erpnext.stock.get_item_details.get_item_details",
				args: {
					"args": {
						"item_code": row.item_code,
						"company": frm.doc.company,
						"doctype": frm.doc.doctype,
					}
				},
				callback: function (r) {
					if (r.message) {
						frappe.model.set_value(cdt, cdn, "item_name", r.message.item_name);
						frappe.model.set_value(cdt, cdn, "rate", r.message.valuation_rate);
						frappe.model.set_value(cdt, cdn, "description", r.message.description);
						frappe.model.set_value(cdt, cdn, "uom", r.message.stock_uom);
						frappe.model.set_value(cdt, cdn, "qty", 1);
						frappe.model.set_value(cdt, cdn, "amount", r.message.valuation_rate * 1);
						frappe.model.set_value(cdt, cdn, "conversion_factor", 1);
					}
				},
			});
		}
	},
	qty: function (frm, cdt, cdn) {
		var row = frappe.get_doc(cdt, cdn);
		if (row.qty && row.rate) {
			frappe.model.set_value(cdt, cdn, "amount", row.qty * row.rate);
		}
	},

	rate: function (frm, cdt, cdn) {
		var row = frappe.get_doc(cdt, cdn);
		if (row.qty && row.rate) {
			frappe.model.set_value(cdt, cdn, "amount", row.qty * row.rate);
		}
	},
});

function open_form(frm, doctype, child_doctype, parentfield) {
	frappe.model.with_doctype(doctype, () => {
		let new_doc = frappe.model.get_new_doc(doctype);

		// add a new row and set the project
		let new_child_doc = frappe.model.get_new_doc(child_doctype);
		new_child_doc.project = frm.doc.name;
		new_child_doc.parent = new_doc.name;
		new_child_doc.parentfield = parentfield;
		new_child_doc.parenttype = doctype;
		new_doc[parentfield] = [new_child_doc];
		new_doc.project = frm.doc.name;

		frappe.ui.form.make_quick_entry(doctype, null, null, new_doc);
	});
}

function get_ordered_items(frm) {
	frappe.call({
		method: "erpnext.projects.doctype.project.project.get_items_in_sales_order",
		args: {
			project: frm.doc.name,
		},
		callback: function (r) {
			let items = r.message;
			let project_items = frm.doc.custom_project_items || [];
			let updated = false;
			for (let i = 0; i < project_items.length; i++) {
				let item = project_items[i];
				let found = items.find((x) => x.item_code === item.item_code);
				if (found) {
					frappe.model.set_value(item.doctype, item.name, "ordered", found.qty);
					updated = true;
				}
			}
			if (updated) {
				frm.refresh_field("custom_project_items");
			}
		},
	});
}

function get_invoiced_items(frm) {
	frappe.call({
		method: "erpnext.projects.doctype.project.project.get_items_in_sales_invoice",
		args: {
			project: frm.doc.name,
		},
		callback: function (r) {
			let items = r.message;
			let project_items = frm.doc.custom_project_items || [];
			let updated = false;
			for (let i = 0; i < project_items.length; i++) {
				let item = project_items[i];
				let found = items.find((x) => x.item_code === item.item_code);
				if (found) {
					frappe.model.set_value(item.doctype, item.name, "invoiced", found.qty);
					updated = true;
				}
			}
			if (updated) {
				frm.refresh_field("custom_project_items");
			}
		},
	});
}

function calculate_total_amount(frm) {
	let total_amount = 0;
	(frm.doc.custom_project_items || []).forEach((item) => {
		total_amount += item.amount;
	});
	frm.set_value("custom_total_company_currency", total_amount);
}

function calculate_total_quantity(frm) {
	let total_qty = 0;
	(frm.doc.custom_project_items || []).forEach((item) => {
		total_qty += item.qty;
	});
	frm.set_value("custom_total_quantity", total_qty);
}

function calculate_remaining_qty(frm) {
	// this function will calculate remaining field of each item
	(frm.doc.custom_project_items || []).forEach((item) => {
		let remaining = item.qty - item.ordered - item.invoiced;
		console.log('item', item);
		frappe.model.set_value(item.doctype, item.name, "remaining", remaining);
	});
}
