({
	getUrlParameter : function(component, sParam) {
		var sPageURL = decodeURIComponent(window.location.search.substring(1));
		var sURLVariables = sPageURL.split('&');
		var sParameterName;
		
		for (var i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? "" : sParameterName[1];
			}
		}
		return "undefined";
	},
	
	showError : function(component, errType) {
		var errMsg;
		if (errType == "invalid")
		{
			errMsg = "Details are not available for this order.";
		}
		else
		{
			errMsg = "An error occurred while loading order details.<br />";
			errMsg += "Kindly visit Contact Us page and provide necessary information.";
		}
		
		var scriptFlag = component.get("v.scriptFlag");
		if (scriptFlag)
		{
			// Hide load spinner
			$("#orderLoadInfo").hide();
			
			// Show the error message
			$("#orderErrorSection").html(errMsg).show();
		}
		else
		{
			document.getElementById("orderLoadInfo").style.display = "none";
			document.getElementById("orderErrorSection").innerHTML = errMsg;
			document.getElementById("orderErrorSection").style.display = "block";
		}
	},
	
	initDisplay : function(component) {
        var dataFlag = component.get("v.dataFlag");
        var scriptFlag = component.get("v.scriptFlag");
        if (dataFlag && scriptFlag)
        {
			// Hide load animation
			$("#orderLoadInfo").hide();
			$("#orderDetailSection").show();
			
			// Fetch order invoices
			var urlGON = component.get("v.urlGON");
			var fetchInvoices = $A.get("e.c:CCP_fetchInvoices");
			fetchInvoices.setParams({ "GON": urlGON }).fire();
		}
	},
	
	processInvoices : function(component, invoicesArr) {
		var orderDet = component.get("v.orderDetails");
		
		if (invoicesArr && orderDet && orderDet.Fsets)
		{
			var currFset;
			var currInvoice;
			var invoiceFlag;
			for(var i = 0; i < orderDet.Fsets.length; i++)
			{
				invoiceFlag = false;
				currFset = orderDet.Fsets[i];
				
				var invHTML = '<div class="panel-body ccp-accorion-body">';
				
				invHTML += '<div class=" col-sm-12 ccp-fset-head">';
				invHTML += '<div class="col-sm-offset-1 col-sm-2"><span title="Reference number of invoice">Invoice Number</span></div>';
				invHTML += '<div class="col-sm-2"><span title="Indicates if entire invoice amount has been paid">Status</span></div>';
				invHTML += '<div class="col-sm-4 ccp-text-right">';
				invHTML += '<div class="col-sm-6 ccp-fset-padding1"><span title="Amount billed on a specific invoice">Invoice Amount</span></div>';
				invHTML += '<div class="col-sm-6 ccp-fset-padding2"><span title="Invoice amount pending payment">Invoice Due Amount</span></div></div>';
				invHTML += '<div class="col-sm-2 ccp-fset-padding3"><span title="Date by which payment is contractually expected">Payment Due Date</span></div>';
				invHTML += '<div class="col-sm-1"></div></div>';
				
				for (var j = 0; j < invoicesArr.length; j++)
				{
					currInvoice = invoicesArr[j];
					
					if (!isNaN(currFset.ShipmentSet) && currFset.ShipmentSet == currInvoice.FSetNumber)
					{
						invoiceFlag = true;
						
						invHTML += '<div class="col-sm-12 ccp-fset-row">';
						invHTML += '<div class="col-sm-offset-1 col-sm-2 ccp-fset-border-left"><span class="ccp-ver-align">';
						invHTML += '<span class="ccp-invoice-num ccp-ellipsis" title="' + currInvoice.InvoiceNumber + '">' + currInvoice.InvoiceNumber + '</span></span></div>';
						invHTML += '<div class="col-sm-2"><span class="ccp-ver-align">';
						invHTML += '<span class="ccp-card-label2 ccp-upper-text">' + currInvoice.InvoiceStatus + '</span>';
						invHTML += '</span></div>';
						invHTML += '<div class="col-sm-4 ccp-text-right">';
						invHTML += '<div class="col-sm-6"><span class="ccp-card-price ccp-fset-padding-amt1 ccp-ver-align">' + CCP_formatAmount(currInvoice.InvoiceAmount, currInvoice.currencyCode) +'</span></div>';
						invHTML += '<div class="col-sm-6"><span class="ccp-card-price ccp-fset-padding-amt2 ccp-ver-align">' + CCP_formatAmount(currInvoice.InvoiceDueAmount, currInvoice.currencyCode) +'</span></div>';
						invHTML += '</div>';
						invHTML += '<div class="col-sm-2 ccp-fset-border-right"><span class="ccp-ver-align ccp-card-label2">' + currInvoice.PaymentDueDate + '</span></div>';
						invHTML += '<div class="col-sm-1"></div>';
						invHTML += '</div>';
					}
				}
				
				invHTML += '</div>';
				
				if (invoiceFlag)
				{
					$("#collapse" + currFset.ShipmentSet).html(invHTML);
					$("#acctoggle" + currFset.ShipmentSet).attr("data-toggle", "collapse");
					$("#acctoggle" + currFset.ShipmentSet).attr("href", "#collapse" + currFset.ShipmentSet);
					$("#acctoggle" + currFset.ShipmentSet).removeClass("ccp-disabled");
				}
			}
		}
	}
})