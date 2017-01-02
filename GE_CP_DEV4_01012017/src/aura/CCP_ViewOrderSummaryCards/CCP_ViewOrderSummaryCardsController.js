({
    scriptsLoaded : function(component, event, helper) {
        component.set("v.scriptFlag", true);
        helper.initDisplay(component);
    },
    
	doneRendering: function(component, event, helper) {
		var scriptFlag = component.get("v.scriptFlag");
		var renderFlag = component.get("v.initialLoad");
		var datesObj = component.get("v.datesObj");
		
		if (!renderFlag && scriptFlag && datesObj.Today && $("#orderFromDate").length > 0)
		{
			// Call this only once at initial load
			component.set("v.initialLoad", true);
            
			$('#orderSearchText').keypress(function (e) {
				var key = e.which;
				if(key == 13)  // the enter key code
				{
					$('#orderSearchButton').click();
					return false;
				}
			});
			
			// Initiate Datepicker
			$( "#orderFromDate" ).datepicker({
				altField: "#orderFromAltDate",
				altFormat: "yy-mm-dd",
				dateFormat: "d M yy",
				changeYear: true,
				yearRange: "-10:+5"
			});
			
			$( "#orderToDate" ).datepicker({
				altField: "#orderToAltDate",
				altFormat: "yy-mm-dd",
				dateFormat: "d M yy",
				changeYear: true,
				yearRange: "-10:+5"
			});
			
			$( "#orderSort" ).toggleClass("selectpicker ccp-sort-selectlist");
			$( "#orderSort" ).selectpicker({dropupAuto: false, dropdownAlignRight: 'auto', size: false, width: 'auto', selectOnTab: true});
			
			//Prevent filter dropdown from closing when clicking inside calendar
			$(".ui-datepicker").on('click',function(event){
				event.stopPropagation();
			});
			
			//Prevent filter dropdown from closing clicking labels etc
			$('#orderToolsDiv ul.ccp-filtering').on('click',function(event){
				event.stopPropagation();
			});
			
			$("#orderFilterDropdown").on('hide.bs.dropdown', function () {
				$("#orderSummaryComp").removeClass("ccp-order-comp-min-height-filter");
				$("#order-filter-button").removeClass("ccp-filter-btn-open");
			});
			
			$("#orderFilterDropdown").on('show.bs.dropdown', function () {
				$("#orderSummaryComp").addClass("ccp-order-comp-min-height-filter");
				$("#order-filter-button").addClass("ccp-filter-btn-open");
			});
			
			$("#orderSort").on('hide.bs.select', function () {
				$("#orderSummaryComp").removeClass("ccp-order-comp-min-height-sort");
			});
			
			$("#orderSort").on('show.bs.select', function () {
				$("#orderSummaryComp").addClass("ccp-order-comp-min-height-sort");
			});
			
			$(window).resize(function() {
				if ($("#orderCView").length > 0)
				{
					component.set("v.comingFromResizeFlag", true);
					$("#orderCView").slick("setOption", "speed", 1, false );
					
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
        component.set("v.orderFilterObj", {isFilter: false});
		component.set("v.arrOrdersObj", []);
        
		helper.firstOrderFetch(component);
        helper.createDatesArray(component);
    },
    
    doSearchOrders : function(component, event, helper){
        var inputSearch = $.trim($("#orderSearchText").val());
		var lastSearch = component.get("v.searchInput");
		
        if (inputSearch.length >= 3 || (lastSearch.length >= 3 && inputSearch.length == 0))
		{
			// When none of date range options is chosen, set the default date range filter
			var filterObj = component.get("v.orderFilterObj");
			if (!filterObj.last30Days && !filterObj.last60Days && !filterObj.dateRange)
			{
				helper.setDefaultFilter(component, true);
			}
			
			component.set("v.searchInput", inputSearch);
			helper.repeatOrderFetch(component);
		}
		else
		{
            $("#orderSearchText").val(inputSearch);
			alert("Error: Please enter minimum 3 characters to perform the search.");
        }
    },
    
    doSortOrders : function(component, event, helper){
		var selectedSort = $("#orderSort").val();
		var sortType, sortOrder;
		if (selectedSort == "orderValAsc")
		{
			sortType = "OrderValue";
			sortOrder = "ASC";
		}
		else if (selectedSort == "orderValDesc")
		{
			sortType = "OrderValue";
			sortOrder = "DESC";
		}
		else if (selectedSort == "orderDateAsc")
		{
			sortType = "OrderDate";
			sortOrder = "ASC";
		}
		else if (selectedSort == "orderDateDesc")
		{
			sortType = "OrderDate";
			sortOrder = "DESC";
		}
		else if (selectedSort == "orderStatusOpen")
		{
			sortType = "OrderStatus";
			sortOrder = "ASC";
		}
		else if (selectedSort == "orderStatusClosed")
		{
			sortType = "OrderStatus";
			sortOrder = "DESC";
		}
		else if (selectedSort == "cNameAsc")
		{
			sortType = "CustName";
			sortOrder = "ASC";
		}
		else if (selectedSort == "cNameDesc")
		{
			sortType = "CustName";
			sortOrder = "DESC";
		}
		
        component.set("v.orderSortType", sortType);
        component.set("v.orderSortOrder", sortOrder);
		helper.repeatOrderFetch(component);
    },
	
	doApplyFilters : function(component, event, helper){
		var validFlag = helper.checkFilters(component);
		if (validFlag)
		{
			helper.repeatOrderFetch(component);
		}
    },
    
	doRemoveFilter : function(component, event, helper){
		var filterObj = component.get("v.orderFilterObj");
		var triggerButton = event.target.id;
		
		if (triggerButton == "order-x-30")
		{
			$("#order-Last-30-Days").prop("checked", false);
			filterObj.last30Days = false;
			filterObj.fromDate = "";
			filterObj.toDate = "";
		}
		else if (triggerButton == "order-x-60")
		{
			$("#order-Last-60-Days").prop("checked", false);
			filterObj.last60Days = false;
			filterObj.fromDate = "";
			filterObj.toDate = "";
		}
		else if (triggerButton == "order-x-range")
		{
			if ($("#" + triggerButton).hasClass("ccp-filter-close-disabled"))
			{
				return;
			}
			$("#order-Date-Range").prop("checked", false);
			$("#orderFromDate, #orderToDate").prop('disabled', true).val("");
			filterObj.dateRange = false;
			filterObj.fromDate = filterObj.fromDateDisplay = "";
			filterObj.toDate = filterObj.toDateDisplay = "";
		}
		else if (triggerButton == "order-x-open")
		{
			$("#order-Open").prop("checked", false);
			filterObj.orderOpen = false;
		}
		else if (triggerButton == "order-x-closed")
		{
			$("#order-Closed").prop("checked", false);
			filterObj.orderClosed = false;
		}
		else if (triggerButton == "order-x-cancelled")
		{
			$("#order-Cancelled").prop("checked", false);
			filterObj.orderCancelled = false;
		}
		
		if (filterObj.orderOpen || filterObj.orderClosed || filterObj.orderCancelled)
		{
			filterObj.statusFilter = true;
			
			filterObj.statusList = "";
			if (filterObj.orderOpen)
			{
				filterObj.statusList = "Open";
			}
			if (filterObj.orderClosed)
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
			if (filterObj.orderCancelled)
			{
				if (filterObj.statusList == "")
				{
					filterObj.statusList = "Cancelled";
				}
				else
				{
					filterObj.statusList += ";Cancelled";
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
		
		component.set("v.orderFilterObj", filterObj);
		
		// When none of date range options is chosen, set the default date range filter
		if (!filterObj.last30Days && !filterObj.last60Days && !filterObj.dateRange)
		{
			helper.setDefaultFilter(component, true);
		}
		
		helper.repeatOrderFetch(component);
	},
	
    doClearFilters : function(component, event, helper){
		$("#order-Last-30-Days, #order-Last-60-Days, #order-Open, #order-Closed, #order-Cancelled").prop("checked", false);
		helper.setDefaultFilter(component, false);
		
		var triggerButton = event.target.id;
		if (triggerButton != "orderPillClearAll")
		{
			$("#order-filter-button").dropdown('toggle');
		}
		
		helper.repeatOrderFetch(component);
    },
	
	disableDateRange : function(component, event, helper){
        $("#orderFromDate, #orderToDate").prop('disabled', true).val("");
    },
	
	enableDateRange : function(component, event, helper){
        $("#orderFromDate, #orderToDate").prop('disabled', false);
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
		helper.handleCardClick(component, event.getParam("GON"));
    }
})