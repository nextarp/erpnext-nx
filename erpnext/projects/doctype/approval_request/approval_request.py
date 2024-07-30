# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ApprovalRequest(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from erpnext.projects.doctype.employee_child_link.employee_child_link import EmployeeChildLink
		from frappe.types import DF

		assigned_user: DF.TableMultiSelect[EmployeeChildLink]
		attachments: DF.Attach | None
		creator: DF.Data | None
		date: DF.Datetime | None
		description: DF.TextEditor
		naming_series: DF.Literal["APPREQ-.####"]
		roles: DF.Link | None
		share_with: DF.Literal["All Users", "Role", "Employees"]
	# end: auto-generated types
	pass
