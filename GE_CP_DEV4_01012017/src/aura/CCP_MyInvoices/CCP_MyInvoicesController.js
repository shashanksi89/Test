({
    scriptsLoaded : function(component, event, helper) {
        component.set("v.scriptFlag", true);
        helper.initDisplay(component);
    },
    
	doneRendering: function(component, event, helper) {
		var scriptFlag = component.get("v.scriptFlag");
		var renderFlag = component.get("v.initialLoad");
		var datesObj = component.get("v.datesObj");
		
		if (!renderFlag && scriptFlag && datesObj.Today && $("#invoiceFromDate").length > 0)
		{
			// Call this only once at initial load
			component.set("v.initialLoad", true);
			
			$('#invoiceSearchText').keypress(function (e) {
				var key = e.which;
				if(key == 13)  // the enter key code
				{
					$('#invoiceSearchButton').click();
					return false;
				}
			});
            
			// Initiate Datepicker
			$( "#invoiceFromDate" ).datepicker({
				altField: "#invoiceFromAltDate",
				altFormat: "yy-mm-dd",
				dateFormat: "d M yy",
				changeYear: true,
				yearRange: "-10:+5"
			});
			
			$( "#invoiceToDate" ).datepicker({
				altField: "#invoiceToAltDate",
				altFormat: "yy-mm-dd",
				dateFormat: "d M yy",
				changeYear: true,
				yearRange: "-10:+5"
			});
			
			$( "#invoiceSort" ).toggleClass("selectpicker ccp-sort-selectlist");
			$( "#invoiceSort" ).selectpicker({dropupAuto: false, dropdownAlignRight: 'auto', size: false, width: 'auto', selectOnTab: true});
			
			//Prevent filter dropdown from closing when clicking inside calendar
			$(".ui-datepicker").on('click',function(event){
				event.stopPropagation();
			});
			
			//Prevent filter dropdown from closing clicking labels etc
			$('#invoiceToolsDiv ul.ccp-filtering').on('click',function(event){
				event.stopPropagation();
			});
			
			$("#invoiceFilterDropdown").on('hide.bs.dropdown', function () {
				$("#myInvoicesComp").removeClass("ccp-my-invoice-comp-min-height-filter");
				$("#invoice-filter-button").removeClass("ccp-filter-btn-open");
			});
			
			$("#invoiceFilterDropdown").on('show.bs.dropdown', function () {
				$("#myInvoicesComp").addClass("ccp-my-invoice-comp-min-height-filter");
				$("#invoice-filter-button").addClass("ccp-filter-btn-open");
			});
			
			$("#invoiceSort").on('hide.bs.select', function () {
				$("#myInvoicesComp").removeClass("ccp-my-invoice-comp-min-height-sort");
			});
			
			$("#invoiceSort").on('show.bs.select', function () {
				$("#myInvoicesComp").addClass("ccp-my-invoice-comp-min-height-sort");
			});
			
			$(window).resize(function() {
				if ($("#invoiceCView").length > 0)
				{
					component.set("v.comingFromResizeFlag", true);
					$("#invoiceCView").slick("setOption", "speed", 1, false );
					
					window.setTimeout(
						$A.getCallback(function() {
							helper.navToCurrentSlide(component);
						}), 1000
					);
				}
			});
			
			helper.setDefaultFilter(component, false);
			helper.initDisplay(component);
		}
	},
	
    doInit : function(component, event, helper) {
        component.set("v.datesObj", {});
        component.set("v.invoiceFilterObj", {isFilter: false});
		component.set("v.arrInvoicesObj", []);
        
		helper.firstInvoiceFetch(component);
        helper.createDatesArray(component);
    },
    
    doSearchInvoices : function(component, event, helper){
        var inputSearch = $("#invoiceSearchText").val();
		var lastSearch = component.get("v.searchInput");
		
		if (inputSearch.length >= 3 || (lastSearch.length >= 3 && inputSearch.length == 0))
		{
            // When none of date range options is chosen, set the default date range filter
			var filterObj = component.get("v.invoiceFilterObj");
			if (!filterObj.last30Days && !filterObj.last60Days && !filterObj.dateRange)
			{
				helper.setDefaultFilter(component, true);
			}
			
			component.set("v.searchInput", inputSearch);
			helper.repeatInvoiceFetch(component, 0);
        }
		else
		{
			$("#invoiceSearchText").val(inputSearch);
			alert("Error: Please enter minimum 3 characters to perform the search.");
        }
    },
    
    doSortInvoices : function(component, event, helper){
		var selectedSort = $("#invoiceSort").val();
		var sortType, sortOrder;
		if (selectedSort == "invoiceValAsc")
		{
			sortType = "InvoiceValue";
			sortOrder = "ASC";
		}
		else if (selectedSort == "invoiceValDesc")
		{
			sortType = "InvoiceValue";
			sortOrder = "DESC";
		}
		else if (selectedSort == "invoiceDateAsc")
		{
			sortType = "InvoiceDate";
			sortOrder = "ASC";
		}
		else if (selectedSort == "invoiceDateDesc")
		{
			sortType = "InvoiceDate";
			sortOrder = "DESC";
		}
		else if (selectedSort == "invoiceStatusAsc")
		{
			sortType = "InvoiceStatus";
			sortOrder = "ASC";
		}
		else if (selectedSort == "invoiceStatusDesc")
		{
			sortType = "InvoiceStatus";
			sortOrder = "DESC";
		}
		
        component.set("v.invoiceSortType", sortType);
        component.set("v.invoiceSortOrder", sortOrder);
		helper.repeatInvoiceFetch(component, 0);
    },
	
	doApplyFilters : function(component, event, helper){
		var validFlag = helper.checkFilters(component);
		if (validFlag)
		{
			helper.repeatInvoiceFetch(component, 0);
		}
    },
    
	doRemoveFilter : function(component, event, helper){
		var filterObj = component.get("v.invoiceFilterObj");
		var triggerButton = event.target.id;
		
		if (triggerButton == "invoice-x-30")
		{
			$("#invoice-Last-30-Days").prop("checked", false);
			filterObj.last30Days = false;
			filterObj.fromDate = "";
			filterObj.toDate = "";
		}
		else if (triggerButton == "invoice-x-60")
		{
			$("#invoice-Last-60-Days").prop("checked", false);
			filterObj.last60Days = false;
			filterObj.fromDate = "";
			filterObj.toDate = "";
		}
		else if (triggerButton == "invoice-x-range")
		{
			if ($("#" + triggerButton).hasClass("ccp-filter-close-disabled"))
			{
				return;
			}
			$("#invoice-Date-Range").prop("checked", false);
			$("#invoiceFromDate, #invoiceToDate").prop('disabled', true).val("");
			filterObj.dateRange = false;
			filterObj.fromDate = filterObj.fromDateDisplay = "";
			filterObj.toDate = filterObj.toDateDisplay = "";
		}
		else if (triggerButton == "invoice-x-open")
		{
			$("#invoice-Open").prop("checked", false);
			filterObj.invoiceOpen = false;
		}
		else if (triggerButton == "invoice-x-closed")
		{
			$("#invoice-Closed").prop("checked", false);
			filterObj.invoiceClosed = false;
		}
		
		if (filterObj.invoiceOpen || filterObj.invoiceClosed)
		{
			filterObj.statusFilter = true;
			
			filterObj.statusList = "";
			if (filterObj.invoiceOpen)
			{
				filterObj.statusList = "Open";
			}
			if (filterObj.invoiceClosed)
			{
				if (filterObj.statusList == "")
				{
					filterObj.statusList = "Closed";
				}
				else
				{
					filterObj.statusList += ";Closed";
				}
			}
		}
		else
		{
			filterObj.statusFilter = false;
			filterObj.statusList = "";
		}
		
		if (filterObj.last30Days || filterObj.last60Days || filterObj.dateRange || filterObj.statusFilter)
		{
			filterObj.isFilter = true;
		}
		else
		{
			filterObj.isFilter = false;
		}
		
		component.set("v.invoiceFilterObj", filterObj);
		
		// When none of date range options is chosen, set the default date range filter
		if (!filterObj.last30Days && !filterObj.last60Days && !filterObj.dateRange)
		{
			helper.setDefaultFilter(component, true);
		}
		
		helper.repeatInvoiceFetch(component, 0);
	},
	
    doClearFilters : function(component, event, helper){
		$("#invoice-Last-30-Days, #invoice-Last-60-Days, #invoice-Date-Range, #invoice-Open, #invoice-Closed").prop("checked", false);
		helper.setDefaultFilter(component, false);
		
		var triggerButton = event.target.id;
		if (triggerButton != "invoicePillClearAll")
		{
			$("#invoice-filter-button").dropdown('toggle');
		}
		
		helper.repeatInvoiceFetch(component, 0);
    },
	
	disableDateRange : function(component, event, helper){
        $("#invoiceFromDate, #invoiceToDate").prop('disabled', true).val("");
    },
	
	enableDateRange : function(component, event, helper){
        $("#invoiceFromDate, #invoiceToDate").prop('disabled', false);
    },
	
	doNavToCardPage : function(component, event, helper){
        var eType = event.getParam("type");
        var pageNum = event.getParam("pageNum");
		
		if (eType == "rebuildPagination")
		{
			helper.rebuildPagination(component);
		}
		else if (eType == "reloadCarousel")
		{
			helper.reloadCarousel(component, true);
		}
		else if (eType == "highlight")
		{
			helper.highlightCard(component, pageNum);
		}
		else if (eType == "unhighlight")
		{
			helper.unhighlightCards(component);
		}
		else
		{
			helper.navToCardPage(component, eType, pageNum);
		}
    },
	
	doHandleCardClick : function(component, event, helper){
		helper.handleCardClick(component, event.getParam("GON"), event.getParam("InvNum"), event.getParam("FSetNum"));
    }
})