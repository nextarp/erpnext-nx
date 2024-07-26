// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("Bank Account", {
	setup: function (frm) {
		frm.set_query("account", function () {
			return {
				filters: {
					account_type: "Bank",
					company: frm.doc.company,
					is_group: 0,
				},
			};
		});
		frm.set_query("party_type", function () {
			return {
				query: "erpnext.setup.doctype.party_type.party_type.get_party_type",
			};
		});
	},
	refresh: function (frm) {
		// Add a new option to the three dots menu
		frm.page.add_menu_item("Update API Credentials", function () {
			// Fetch existing data
			frappe.call({
				method: "frappe.client.get",
				args: {
					doctype: "Bank Account",
					name: frm.doc.name
				},
				callback: function (r) {
					if (r.message) {
						let data = r.message;

						// Check if the bank account is a company account
						if (data.is_company_account === 0) {
							// Display an error message and cut the process
							frappe.msgprint("Only company bank accounts can update credentials.");
							return; // Stop execution
						}

						let fields = getFieldsBasedOnBicSwiftCode(frm, data);

						// Create and show the dialog
						let dialog = new frappe.ui.Dialog({
							title: setTitle(frm),
							fields: fields,
							primary_action_label: 'Update',
							primary_action(values) {
								// Initialize the args object with the name property
								let args = prepareArgsForBankAccountUpdate(frm, values);

								dialog.hide();
								// Ask for confirmation before sending the backend request
								frappe.confirm(
									'Are you sure you want to update the credentials? This action cannot be undone.',
									function () {
										// User confirmed, proceed with the backend request
										frappe.call({
											method: "erpnext.accounts.doctype.bank_account.bank_account.update_bank_account_credentials",
											args: args,
											callback: function (response) {
												if (response.message.status === "success") {
													frappe.msgprint(response.message.message);
													frm.reload_doc();
												} else {
													frappe.msgprint(response.message.message);
												}
											}
										});
									},
									function () {
										// User canceled, do nothing
										console.log('Update canceled by the user.');
									}
								);
							}
						});
						if (frm.doc.custom_bicswift_code && frm.doc.custom_bicswift_code.startsWith("ABNANL")) {
							dialog.get_field("custom_certificate").df.options = {
								restrictions: {
									allowed_file_types: [".crt"],
								},
							};
							dialog.get_field("custom_private_key").df.options = {
								restrictions: {
									allowed_file_types: [".key"],
								},
							};
						}

						dialog.show();
					}
				}
			});
		});
		frappe.dynamic_link = {doc: frm.doc, fieldname: "name", doctype: "Bank Account"};

		frm.toggle_display(["address_html", "contact_html"], !frm.doc.__islocal);

		if (frm.doc.__islocal) {
			frappe.contacts.clear_address_and_contact(frm);
		} else {
			frappe.contacts.render_address_and_contact(frm);
		}

		if (frm.doc.integration_id) {
			frm.add_custom_button(__("Unlink external integrations"), function () {
				frappe.confirm(
					__(
						"This action will unlink this account from any external service integrating ERPNext with your bank accounts. It cannot be undone. Are you certain ?"
					),
					function () {
						frm.set_value("integration_id", "");
					}
				);
			});
		}
	},

	is_company_account: function (frm) {
		frm.set_df_property("account", "reqd", frm.doc.is_company_account);
	},
});

function getFieldsBasedOnBicSwiftCode(frm, data) {
    if (frm.doc.custom_bicswift_code && frm.doc.custom_bicswift_code.startsWith("ABNANL")) {
        return [
            {
                label: 'API Key',
                fieldname: 'custom_api_key',
                fieldtype: 'Data',
                default: data.custom_api_key
            },
            {
                label: 'Payment API Key',
                fieldname: 'custom_payment_api_key',
                fieldtype: 'Data',
                default: data.custom_payment_api_key
            },
            {
                label: 'Client ID',
                fieldname: 'custom_client_id',
                fieldtype: 'Data',
                default: data.custom_client_id
            },
            {
                label: 'Certificate',
                fieldname: 'custom_certificate',
                fieldtype: 'Attach',
                default: data.custom_certificate,
            },
            {
                label: 'Private Key',
                fieldname: 'custom_private_key',
                fieldtype: 'Attach',
                default: data.custom_private_key
            }
        ];
    } else {
        return [
            {
                label: 'Client ID',
                fieldname: 'custom_client_id',
                fieldtype: 'Data',
                default: frm.doc.custom_client_id
            },
            {
                label: 'Client Secret',
                fieldname: 'custom_client_secret',
                fieldtype: 'Data',
				default: frm.doc.custom_client_secret
            }
        ];
    }
}

function prepareArgsForBankAccountUpdate(frm, values) {
    let args = {
        name: frm.doc.name
    };

    if (frm.doc.custom_bicswift_code && frm.doc.custom_bicswift_code.startsWith("ABNANL")) {
        Object.assign(args, {
			will_be_updated_api: "abnamro",
            custom_api_key: values.custom_api_key,
            custom_payment_api_key: values.custom_payment_api_key,
            custom_client_id: values.custom_client_id,
            custom_certificate: values.custom_certificate,
            custom_private_key: values.custom_private_key
        });
    } else {
        Object.assign(args, {
			will_be_updated_api: "myponto",
            custom_client_id: values.custom_client_id,
            custom_client_secret: values.custom_client_secret
        });
    }

	console.log("args", args, values.custom_client_id, values);

    return args;
}

function setTitle(frm) {
	return frm.doc.custom_bicswift_code && frm.doc.custom_bicswift_code.startsWith("ABNANL") ? "Update ABN AMRO API Credentials" : "Update MyPonto API Credentials";
}
