# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt
import frappe
# import frappe
from frappe.model.document import Document


class Incident(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.
	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		attach_image: DF.AttachImage | None
		date: DF.Datetime | None
		employee: DF.Link | None
		location_name: DF.Data
		project: DF.Link | None
		status: DF.Literal["Open", "In Progress", "Done"]
		street_name: DF.Data | None
		topic: DF.Data
	# end: auto-generated types

	def before_save(self):
		employee = frappe.get_value("Employee", {"user_id": frappe.session.user}, "name")
		if not employee:
			frappe.throw(
				'<p>You are not an employee. Please check the <a href="/app/employee">Employee List</a> and create an employee from that page.</p>')

@frappe.whitelist()
def get_employee_from_current_user():
	employee = frappe.get_value("Employee", {"user_id": frappe.session.user}, "name")
	return employee
