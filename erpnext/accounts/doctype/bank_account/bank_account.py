# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt


import frappe
from frappe import _
from frappe.contacts.address_and_contact import (
	delete_contact_and_address,
	load_address_and_contact,
)
from frappe.model.document import Document
from frappe.utils import comma_and, get_link_to_form


class BankAccount(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		account: DF.Link | None
		account_name: DF.Data
		account_subtype: DF.Link | None
		account_type: DF.Link | None
		bank: DF.Link
		bank_account_no: DF.Data | None
		branch_code: DF.Data | None
		company: DF.Link | None
		disabled: DF.Check
		iban: DF.Data | None
		integration_id: DF.Data | None
		is_company_account: DF.Check
		is_default: DF.Check
		last_integration_date: DF.Date | None
		mask: DF.Data | None
		party: DF.DynamicLink | None
		party_type: DF.Link | None
	# end: auto-generated types

	def onload(self):
		"""Load address and contacts in `__onload`"""
		load_address_and_contact(self)

	def autoname(self):
		self.name = self.account_name + " - " + self.bank

	def on_trash(self):
		delete_contact_and_address("BankAccount", self.name)

	def validate(self):
		self.validate_company()
		self.validate_iban()
		self.validate_account()
		self.update_default_bank_account()

	def validate_account(self):
		if self.account:
			if accounts := frappe.db.get_all(
				"Bank Account", filters={"account": self.account, "name": ["!=", self.name]}, as_list=1
			):
				frappe.throw(
					_("'{0}' account is already used by {1}. Use another account.").format(
						frappe.bold(self.account),
						frappe.bold(comma_and([get_link_to_form(self.doctype, x[0]) for x in accounts])),
					)
				)

	def validate_company(self):
		if self.is_company_account and not self.company:
			frappe.throw(_("Company is manadatory for company account"))

	def validate_iban(self):
		"""
		Algorithm: https://en.wikipedia.org/wiki/International_Bank_Account_Number#Validating_the_IBAN
		"""
		# IBAN field is optional
		if not self.iban:
			return

		def encode_char(c):
			# Position in the alphabet (A=1, B=2, ...) plus nine
			return str(9 + ord(c) - 64)

		# remove whitespaces, upper case to get the right number from ord()
		iban = "".join(self.iban.split(" ")).upper()

		# Move country code and checksum from the start to the end
		flipped = iban[4:] + iban[:4]

		# Encode characters as numbers
		encoded = [encode_char(c) if ord(c) >= 65 and ord(c) <= 90 else c for c in flipped]

		try:
			to_check = int("".join(encoded))
		except ValueError:
			frappe.throw(_("IBAN is not valid"))

		if to_check % 97 != 1:
			frappe.throw(_("IBAN is not valid"))

	def update_default_bank_account(self):
		if self.is_default and not self.disabled:
			frappe.db.set_value(
				"Bank Account",
				{
					"party_type": self.party_type,
					"party": self.party,
					"is_company_account": self.is_company_account,
					"is_default": 1,
					"disabled": 0,
				},
				"is_default",
				0,
			)


@frappe.whitelist()
def make_bank_account(doctype, docname):
	doc = frappe.new_doc("Bank Account")
	doc.party_type = doctype
	doc.party = docname

	return doc


@frappe.whitelist()
def update_bank_account_credentials(name, custom_api_key=None, custom_client_id=None,
									custom_certificate=None, custom_private_key=None,
									custom_payment_api_key=None, custom_client_secret=None,
									will_be_updated_api=None):
	try:
		doc = frappe.get_doc("Bank Account", name)
		if will_be_updated_api == "abnamro":
			doc.custom_api_key = custom_api_key
			doc.custom_payment_api_key = custom_payment_api_key
			doc.custom_client_id = custom_client_id
			doc.custom_certificate = custom_certificate
			doc.custom_private_key = custom_private_key
		else:
			doc.custom_client_secret = custom_client_secret
			doc.custom_client_id = custom_client_id

		doc.save()
		frappe.db.commit()
		return {"status": "success", "message": "Bank account credentials updated successfully."}
	except Exception as e:
		frappe.log_error(message=str(e), title="Update Bank Account Credentials Error")
		return {"status": "error",
				"message": "An error occurred while updating the bank account credentials."}


def get_party_bank_account(party_type, party):
	return frappe.db.get_value(
		"Bank Account",
		{"party_type": party_type, "party": party, "is_default": 1, "disabled": 0},
		"name",
	)


def get_default_company_bank_account(company, party_type, party):
	default_company_bank_account = frappe.db.get_value(party_type, party, "default_bank_account")
	if default_company_bank_account:
		if company != frappe.get_cached_value("Bank Account", default_company_bank_account, "company"):
			default_company_bank_account = None

	if not default_company_bank_account:
		default_company_bank_account = frappe.db.get_value(
			"Bank Account", {"company": company, "is_company_account": 1, "is_default": 1}
		)

	return default_company_bank_account


@frappe.whitelist()
def get_bank_account_details(bank_account):
	return frappe.get_cached_value(
		"Bank Account", bank_account, ["account", "bank", "bank_account_no"], as_dict=1
	)
