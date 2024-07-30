# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class UserApproval(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		approve: DF.Check
		modified_date: DF.Datetime | None
		related_user: DF.Link | None
		request_details: DF.Link | None
		status: DF.Data | None
	# end: auto-generated types
	pass
