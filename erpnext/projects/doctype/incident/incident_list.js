frappe.listview_settings["Incident"] = {
	hide_name_column: true,
	hide_name_filter: true,
	get_indicator: function (doc) {
		if (doc.status === "Open") {
			return [__("Open"), "orange", "status,=,Open"];
		} else if (doc.status === "In Progress") {
			return [__("In Progress"), "blue", "status,=,In Progress"];
		} else if (doc.status === "Done") {
			return [__("Done"), "green", "status,=,Done"];
		}
	},
};
