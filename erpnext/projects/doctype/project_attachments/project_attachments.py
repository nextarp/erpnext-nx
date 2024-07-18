# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ProjectAttachments(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		document_type: DF.Literal["Aanvraag", "Schouw", "Tekeningen", "Materiaal offerte", "Inkoop facturen", "Calculatie intern", "Offerte opdracht", "Planning", "KLIC", "Monteurs", "Netbeheerder werkzaamheden", "Meer & minder werk", "Revisie", "Oplevering", "Productiestaten / werkbonnen", "Email", "Oude documenten", "Verkoop facturen", "Uitvoering week"]
		file: DF.Attach
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		uploaded_at: DF.Datetime | None
		uploaded_by: DF.Link | None
	# end: auto-generated types
	pass
