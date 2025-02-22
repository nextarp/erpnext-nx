frappe.listview_settings["Timesheet"] = {
	add_fields: ["status", "total_hours", "start_date", "end_date"],
	hide_name_filter: true,
	get_indicator: function (doc) {
		if (doc.status == "Billed") {
			return [__("Billed"), "green", "status,=," + "Billed"];
		}

		if (doc.status == "Payslip") {
			return [__("Payslip"), "green", "status,=," + "Payslip"];
		}

		if (doc.status == "Completed") {
			return [__("Completed"), "green", "status,=," + "Completed"];
		}
	},
	refresh: function (listview) {
		$('span[title^="Project:"]').on('click', function () {
			let projectName = $(this).find('a').text();
			var projectUrl = 'project/' + projectName;
			window.location.href = projectUrl;
		});
	}
};

