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
		attachment: DF.Attach | None
		description: DF.TextEditor | None
		modified_date: DF.Datetime | None
		related_user: DF.Link | None
		request_details: DF.Data | None
		status: DF.Data | None
		topic: DF.Data | None
	# end: auto-generated types

	def validate(self):
		if self.approve:
			self.status = "Approved"
