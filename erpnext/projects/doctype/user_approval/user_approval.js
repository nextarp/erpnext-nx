// Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("User Approval", {
    refresh(frm) {
        // Check if the document is already created (not new)
        if (!frm.is_new()) {
            // Set the related_user field to read-only
            frm.set_df_property("related_user", "read_only", 1);
            frm.set_df_property("request_details", "read_only", 1);
			if(frm.doc.approve){
				frm.set_df_property("approve", "read_only", 1);
			}
        }
    },
});
