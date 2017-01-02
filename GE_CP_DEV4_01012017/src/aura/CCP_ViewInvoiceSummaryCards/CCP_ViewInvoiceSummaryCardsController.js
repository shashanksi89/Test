({
    scriptsLoaded : function(component, event, helper) {
        component.set("v.scriptFlag", true);
        helper.initDisplay(component);
    },
	
	doneRendering: function(component, event, helper) {
		var scriptFlag = component.get("v.scriptFlag");
		var renderFlag = component.get("v.initialLoad");
		
		if (!renderFlag && scriptFlag && $("#invoiceFromDate").length > 0)
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
				$("#invoiceSummaryComp").removeClass("ccp-invoice-comp-min-height-filter");
				$("#invoice-filter-button").removeClass("ccp-filter-btn-open");
			});
			
			$("#invoiceFilterDropdown").on('show.bs.dropdown', function () {
				$("#invoiceSummaryComp").addClass("ccp-invoice-comp-min-height-filter");
				$("#invoice-filter-button").addClass("ccp-filter-btn-open");
			});
			
			$("#invoiceSort").on('hide.bs.select', function () {
				$("#invoiceSummaryComp").removeClass("ccp-invoice-comp-min-height-sort");
			});
			
			$("#invoiceSort").on('show.bs.select', function () {
				$("#invoiceSummaryComp").addClass("ccp-invoice-comp-min-height-sort");
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
		}
	},
	
    doInit : function(component, event, helper) {
        component.set("v.datesObj", {});
        component.set("v.invoiceFilterObj", {isFilter: false});
		component.set("v.arrInvoicesObj", []);
        
        helper.createDatesArray(component);
		
		var urlGON = helper.getUrlParameter(component, "on");
		component.set("v.urlGON", urlGON);
    },
	
	doFetchInvoices : function(component, event, helper) {
        var GON = event.getParam("GON");
		if (GON == "NONE")
		{
			document.getElementById("invoiceSummaryComp").style.display = "none";
			component.set("v.activeGON", GON);
		}
		else
		{
			document.getElementById("invoiceSummaryComp").style.display = "block";
			helper.fetchInvoicesJSON(component, GON);
		}
	},
	
	doSearchInvoices : function(component, event, helper){
        var inputSearch = $.trim($("#invoiceSearchText").val());
		var lastSearch = component.get("v.searchInput");
		
		if (inputSearch.length >= 3 || (lastSearch.length >= 3 && inputSearch.length == 0))
		{
			component.set("v.searchInput", inputSearch);
			$("#invoiceSearchText").val(inputSearch);
			helper.searchInvoices(component);
		}
		else
		{
            $("#invoiceSearchText").val(inputSearch);
			alert("Error: Please enter minimum 3 characters to perform the search.");
        }
    },
	
	doSortInvoices : function(component, event, helper){
		// Show load animation
		$("#invoiceLoadInfo").show();
		// Set the correct value in the search box
		var inputSearch = component.get("v.searchInput");
		$("#invoiceSearchText").val(inputSearch);
		// Remove the old data and destroy the carousel
		helper.reloadCarousel(component, false);
		// Disable search/sort/filter and hide the pagination
		$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", true);
		$("#invoiceSort").selectpicker('refresh');
		$("#invoicePageSection").hide();
		// Hide any error messages
		$("#invoiceErrorSection").text("").hide();
		// Hide filter pills
		$("#invoicePillsSection").hide();
		
		window.setTimeout(
			$A.getCallback(function() {
				var selectedSort = $("#invoiceSort").val();
				component.set("v.invoiceSortType", selectedSort);
				
				var invoicesArr = component.get("v.arrInvoicesObj");
				if (invoicesArr.length > 0)
				{
					$("#invoicePageSection").show();
					helper.sortInvoices(component);
					helper.populateInvoices(component);
				}
				else
				{
					var inputSearch = component.get("v.searchInput");
					if (inputSearch != "")
					{
						$("#invoiceErrorSection").text("Your search did not yield any matching invoices.").show();
					}
					else
					{
						var filterObj = component.get("v.invoiceFilterObj");
						if (filterObj.isFilter)
						{
							$("#invoiceErrorSection").text("Your filter did not yield any matching invoices.").show();
						}
						else
						{
							$("#invoiceErrorSection").text("No invoices were found.").show();
						}
					}
					component.set("v.activeSlideNum", -1);
				}
				
				// Hide load spinner
				$("#invoiceLoadInfo").hide();
				// Enable search/sort/filter
				$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", false);
				$("#invoiceSort").selectpicker('refresh');
				// Show the applicable filter pills
				helper.showHideFilterPills(component);
			}), 500
		);
	},
	
	doApplyFilters : function(component, event, helper){
		var validFlag = helper.checkFilters(component);
		
		if (!validFlag)
		{
			return;
		}
		
		$("#invoice-filter-button").dropdown('toggle');
		
		// Show load animation
		$("#invoiceLoadInfo").show();
		// Set the correct value in the search box
		var inputSearch = component.get("v.searchInput");
		$("#invoiceSearchText").val(inputSearch);
		// Remove the old data and destroy the carousel
		helper.reloadCarousel(component, false);
		// Disable search/sort/filter and hide the pagination
		$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", true);
		$("#invoiceSort").selectpicker('refresh');
		$("#invoicePageSection").hide();
		// Hide any error messages
		$("#invoiceErrorSection").text("").hide();
		// Hide filter pills
		$("#invoicePillsSection").hide();
		
		window.setTimeout(
			$A.getCallback(function() {
				helper.filterInvoices(component);
				
				var invoicesArr = component.get("v.arrInvoicesObj");
				if (invoicesArr.length > 0)
				{
					$("#invoicePageSection").show();
					helper.sortInvoices(component);
					helper.populateInvoices(component);
				}
				else
				{
					var inputSearch = component.get("v.searchInput");
					if (inputSearch != "")
					{
						$("#invoiceErrorSection").text("Your search did not yield any matching invoices.").show();
					}
					else
					{
						$("#invoiceErrorSection").text("Your filter did not yield any matching invoices.").show();
					}
					component.set("v.activeSlideNum", -1);
				}
				
				// Hide load spinner
				$("#invoiceLoadInfo").hide();
				// Enable search/sort/filter
				$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", false);
				$("#invoiceSort").selectpicker('refresh');
				// Show the applicable filter pills
				helper.showHideFilterPills(component);
			}), 500
		);
    },
	
	doRemoveFilter : function(component, event, helper){
		// Show load animation
		$("#invoiceLoadInfo").show();
		// Set the correct value in the search box
		var inputSearch = component.get("v.searchInput");
		$("#invoiceSearchText").val(inputSearch);
		// Remove the old data and destroy the carousel
		helper.reloadCarousel(component, false);
		// Disable search/sort/filter and hide the pagination
		$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", true);
		$("#invoiceSort").selectpicker('refresh');
		$("#invoicePageSection").hide();
		// Hide any error messages
		$("#invoiceErrorSection").text("").hide();
		// Hide filter pills
		$("#invoicePillsSection").hide();
		
		window.setTimeout(
			$A.getCallback(function() {
				var filterObj = component.get("v.invoiceFilterObj");
				var triggerButton = event.target.id;
				
				if (triggerButton == "invoice-x-30")
				{
					$("#invoice-Last-30-Days").prop("checked", false);
					filterObj.last30Days = false;
				}
				else if (triggerButton == "invoice-x-60")
				{
					$("#invoice-Last-60-Days").prop("checked", false);
					filterObj.last60Days = false;
				}
				else if (triggerButton == "invoice-x-range")
				{
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
				}
				else
				{
					filterObj.statusFilter = false;
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
				helper.filterInvoices(component);
				
				var invoicesArr = component.get("v.arrInvoicesObj");
				if (invoicesArr.length > 0)
				{
					$("#invoicePageSection").show();
					helper.sortInvoices(component);
					helper.populateInvoices(component);
				}
				else
				{
					var inputSearch = component.get("v.searchInput");
					if (inputSearch != "")
					{
						$("#invoiceErrorSection").text("Your search did not yield any matching invoices.").show();
					}
					else
					{
						$("#invoiceErrorSection").text("Your filter did not yield any matching invoices.").show();
					}
					component.set("v.activeSlideNum", -1);
				}
				
				// Hide load spinner
				$("#invoiceLoadInfo").hide();
				// Enable search/sort/filter
				$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", false);
				$("#invoiceSort").selectpicker('refresh');
				// Show the applicable filter pills
				helper.showHideFilterPills(component);
			}), 500
		);
	},
	
    doClearFilters : function(component, event, helper){
		var triggerButton = event.target.id;
		if (triggerButton != "invoicePillClearAll")
		{
			$("#invoice-filter-button").dropdown('toggle');
		}
		
		// Show load animation
		$("#invoiceLoadInfo").show();
		// Set the correct value in the search box
		var inputSearch = component.get("v.searchInput");
		$("#invoiceSearchText").val(inputSearch);
		// Remove the old data and destroy the carousel
		helper.reloadCarousel(component, false);
		// Disable search/sort/filter and hide the pagination
		$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", true);
		$("#invoiceSort").selectpicker('refresh');
		$("#invoicePageSection").hide();
		// Hide any error messages
		$("#invoiceErrorSection").text("").hide();
		// Hide filter pills
		$("#invoicePillsSection").hide();
		
		window.setTimeout(
			$A.getCallback(function() {
				$("#invoice-Last-30-Days, #invoice-Last-60-Days, #invoice-Date-Range, #invoice-Open, #invoice-Closed").prop("checked", false);
				$("#invoiceFromDate, #invoiceToDate").prop('disabled', true).val("");
				var filterObj = {isFilter : false};
				component.set("v.invoiceFilterObj", filterObj);
				helper.filterInvoices(component);
				
				var invoicesArr = component.get("v.arrInvoicesObj");
				if (invoicesArr.length > 0)
				{
					$("#invoicePageSection").show();
					helper.sortInvoices(component);
					helper.populateInvoices(component);
				}
				else
				{
					var inputSearch = component.get("v.searchInput");
					if (inputSearch != "")
					{
						$("#invoiceErrorSection").text("Your search did not yield any matching invoices.").show();
					}
					else
					{
						$("#invoiceErrorSection").text("No invoices were found.").show();
					}
					component.set("v.activeSlideNum", -1);
				}
				
				// Hide load spinner
				$("#invoiceLoadInfo").hide();
				// Enable search/sort/filter
				$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", false);
				$("#invoiceSort").selectpicker('refresh');
				// Show the applicable filter pills
				helper.showHideFilterPills(component);
			}), 500
		);
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
    }
})