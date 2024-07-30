# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt
import frappe
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
		topic: DF.Data | None
	# end: auto-generated types

	def after_insert(self):
		shared_with_type = self.share_with
		if shared_with_type == "All Users":
			# get all users
			all_users = frappe.get_all("User", fields=["name"])
			for user in all_users:
				# for each user, we have to create a new User Approval document
				approval_request = frappe.new_doc("User Approval")
				approval_request.related_user = user.name
				approval_request.request_details = self.name
				approval_request.description = self.description
				approval_request.attachment = self.attachments
				approval_request.topic = self.topic
				approval_request.save()
		elif shared_with_type == "Role":
			# get all users in the role
			all_users = frappe.get_all("Has Role", filters={"parenttype": "User", "role": self.roles}, fields=["parent"])
			for user in all_users:
				# for each user, we have to create a new User Approval document
				approval_request = frappe.new_doc("User Approval")
				approval_request.related_user = user.parent
				approval_request.request_details = self.name
				approval_request.description = self.description
				approval_request.attachment = self.attachments
				approval_request.topic = self.topic
				approval_request.save()
		elif shared_with_type == "Employees":
			# get all users in the role
			all_users = self.assigned_user
			for user in all_users:
				# for each user, we have to create a new User Approval document
				approval_request = frappe.new_doc("User Approval")
				# from the user.employee we need to get the real user and assign the approval request to that user
				employee = frappe.get_value("Employee", user.employee, "user_id")
				user = frappe.get_value("User", {"email": employee}, "name")
				approval_request.related_user = user
				approval_request.request_details = self.name
				approval_request.description = self.description
				approval_request.attachment = self.attachments
				approval_request.topic = self.topic
				approval_request.insert()
		return

