({
    createDatesArray : function(component){
        var action = component.get("c.createDatesArray");	
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                component.set("v.datesObj", response.getReturnValue());
            }
			else if (state === "ERROR"){
                this.showError(component, "");
            }
        });
        $A.enqueueAction(action);
    },
	
	showError : function(component, msg) {
		var errMsg;
		
		if (msg == "")
		{
			errMsg = "An error occurred while loading orders.<br />";
			errMsg += "Kindly visit Contact Us page and provide necessary information.";
		}
		else
		{
			errMsg = msg;
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
	
	setDefaultFilter : function(component, useExisting){
		$("#order-Date-Range").prop("checked", true);
		$("#orderFromDate, #orderToDate").prop('disabled', false);
		
		var datesObj = component.get("v.datesObj");
		$( "#orderFromDate" ).datepicker('setDate', datesObj.Last6MonthsDisplay);
		$( "#orderToDate" ).datepicker('setDate', datesObj.TodayDisplay);
		
		var filterObj;
		if (useExisting)
		{
			filterObj = component.get("v.orderFilterObj");
		}
		else
		{
			filterObj = {};
		}
		
		filterObj.fromDate = $("#orderFromAltDate").val();
		filterObj.fromDateDisplay = $("#orderFromDate").val();
		filterObj.toDate = $("#orderToAltDate").val();
		filterObj.toDateDisplay = $("#orderToDate").val();
		filterObj.dateRange = true;
		filterObj.isFilter = true;
		
		component.set("v.orderFilterObj", filterObj);
		component.set("v.manualDefaultFlag", false);
	},
    
    firstOrderFetch : function(component) {
        var sortType = component.get("v.orderSortType");
        var sortOrder = component.get("v.orderSortOrder");
		var action = component.get("c.fetchMyOrdersJSON");
        action.setParams({
            "inputSearch": "",
            "sortType": sortType,
			"sortOrder": sortOrder,
			"fromDate": "",
			"toDate_ISO": "",
			"orderStatusFilter": "",
			"defaultDateFlag": true
        });
		
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                component.set("v.orderWrappersJSON", response.getReturnValue());
                component.set("v.dataFlag", true);
                this.initDisplay(component);
            }
			else if (state === "ERROR"){
                this.showError(component, "");
            }
		});
        $A.enqueueAction(action);
	},
    
    initDisplay : function(component) {
        var dataFlag = component.get("v.dataFlag");
        var scriptFlag = component.get("v.scriptFlag");
		var renderFlag = component.get("v.initialLoad");
		
        if (dataFlag && scriptFlag && renderFlag)
        {
            var ordersArr = JSON.parse(component.get("v.orderWrappersJSON"));
            component.set("v.arrOrdersObj", ordersArr);
            
			$("#orderSearchText, #orderSearchButton, #orderSort, #order-filter-button").prop("disabled", false);
			$("#orderSort").selectpicker('refresh');
            this.showHideFilterPills(component);
			
            if (!ordersArr || ordersArr.length == 0)
            {
				$("#orderErrorSection").text("Your filter did not yield any matching orders.").show();
            }
            else
            {
				
				this.populateOrders(component);
            }
			
			// Hide load animation
			$("#orderLoadInfo").hide();
        }
    },
    
	// Function to fetch the search results, sorted & filtered results from server
    repeatOrderFetch : function(component) {
        // Check for search input
		var inputSearch = component.get("v.searchInput");
        
		// Check for applied sort
		var sortType = component.get("v.orderSortType");
		var sortOrder = component.get("v.orderSortOrder");
		
		// Check for applied filters
		var filterObj = component.get("v.orderFilterObj");
		var fromDate = "";
		var toDate = "";
		var orderStatusFilter = "";
		
		var defaultDateFilter = true;
		if (inputSearch != "")
		{
			defaultDateFilter = false;
		}
		
		if (filterObj.isFilter)
		{
			// Check if any of the date filter is applied
			if (filterObj.dateRange)
			{
				fromDate = filterObj.fromDate;
				toDate = filterObj.toDate;
				if (inputSearch != "")
				{
					var manualDefaultFlag = component.get("v.manualDefaultFlag");
					var datesObj = component.get("v.datesObj");
					if (!manualDefaultFlag && datesObj.Last6Months == fromDate && datesObj.Today == toDate)
					{
						fromDate = "";
						toDate = "";
						
						var newFilterObj = component.get("v.orderFilterObj");
						newFilterObj.fromDate = "";
						newFilterObj.fromDateDisplay = "";
						newFilterObj.toDate = "";
						newFilterObj.toDateDisplay = "";
						newFilterObj.dateRange = false;
						
						if (!newFilterObj.statusFilter)
						{
							newFilterObj.isFilter = false;
						}
						
						component.set("v.orderFilterObj", newFilterObj);
					}
				}
			}
			else if (filterObj.last30Days || filterObj.last60Days)
			{
				fromDate = filterObj.fromDate;
				toDate = filterObj.toDate;
			}
			// Check the status filter
			if (filterObj.statusFilter)
			{
				orderStatusFilter = filterObj.statusList;
			}
		}
		
		// Call Apex method and pass all required params for search/sort/filter
		var action = component.get("c.fetchMyOrdersJSON");
        action.setParams({
            "inputSearch": inputSearch,
            "sortType": sortType,
			"sortOrder": sortOrder,
			"fromDate_ISO": fromDate,
			"toDate_ISO": toDate,
			"orderStatusFilter": orderStatusFilter,
			"defaultDateFlag": defaultDateFilter
        });
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                var strResponse = response.getReturnValue();
				
				// Hide load spinner
				$("#orderLoadInfo").hide();
				// Enable search/sort/filter
				$("#orderSearchText, #orderSearchButton, #orderSort, #order-filter-button").prop("disabled", false);
				$("#orderSort").selectpicker('refresh');
				// Show the applicable filter pills
				this.showHideFilterPills(component);
				
				if (strResponse == "Too many results")
				{
					this.showError(component, "Please refine your search/filter criteria to limit the number of results.");
				}
				else
				{
					component.set("v.orderWrappersJSON", strResponse);
					var ordersArr = JSON.parse(strResponse);
					component.set("v.arrOrdersObj", ordersArr);
					
					// Populate carousel when there is data returned
					if (ordersArr.length > 0)
					{
						this.populateOrders(component);
					}
					// When no data is returned, display appropriate error message
					else
					{
						if (inputSearch != "")
						{
							$("#orderErrorSection").text("Your search did not yield any matching orders.").show();
						}
						else if ((fromDate != "" && toDate != "" ) || orderStatusFilter != "")
						{
							$("#orderErrorSection").text("Your filter did not yield any matching orders.").show();
						}
						else
						{
							$("#orderErrorSection").text("No orders were found.").show();
						}
						
						component.set("v.activeSlideNum", -1);
					}
				}
            }
			else if (state === "ERROR"){
                this.showError(component, "");
            }
		});
        $A.enqueueAction(action);
		
		// While submitting the apex call - perform the following required activites
		// Show load spinner
		$("#orderLoadInfo").show();
		// Set the correct value in the search box
		$("#orderSearchText").val(inputSearch);
		// Remove existing carousel
		this.reloadCarousel(component, false);
		// Disable search/sort/filter
		$("#orderSearchText, #orderSearchButton, #orderSort, #order-filter-button").prop("disabled", true);
		$("#orderSort").selectpicker('refresh');
		// Remove existing pagination
		$("#orderPages").html("");
		// Hide any error messages
		$("#orderErrorSection").text("").hide();
		// Hide filter pills
		$("#orderPillsSection").hide();
		
		// Saurabh - Write Code To Hide Invoices Panel
		this.handleCardClick(component, "NONE");
	},
    
	// Check applied filters and update the filter object
	checkFilters: function(component){
	    var filterObj = {};
		filterObj.isFilter = false;
		
		// When date range filter is selected
		if ($("#order-Date-Range").prop("checked"))
		{
			var fromDateDisplay = $("#orderFromDate").val();
			var toDateDisplay = $("#orderToDate").val();
			
			if (!fromDateDisplay || !toDateDisplay)
			{
				alert("Error: Please choose From and To dates for the date range filter.");
				return false;
			}
			else
			{
				var fromDate = $("#orderFromAltDate").val();
				var toDate = $("#orderToAltDate").val();
				
				// Create a new date object using From Date to calculated max possible To Date
				var myDate = new Date(fromDate);
				// Add 6 months to the above date
				var month = myDate.getUTCMonth();
				myDate.setUTCMonth(month + 6);
				// Substract one date from the above date
				var dayOfMonth = myDate.getUTCDate();
				myDate.setUTCDate(dayOfMonth - 1);
				// Extract the date in yyyy-mm-dd ISO format
				myDate = myDate.toISOString().substring(0, 10);
				
				if (toDate < fromDate)
				{
					alert("Error: To date cannot be earlier than From date.");
					return false;
				}
				else if (toDate > myDate)
				{
					alert("Error: Please choose a maximum of six months period.");
					return false;
				}
				
				filterObj.fromDate = fromDate;
				filterObj.fromDateDisplay = $("#orderFromDate").val();
				filterObj.toDate = toDate;
				filterObj.toDateDisplay = $("#orderToDate").val();
				filterObj.dateRange = true;
				filterObj.isFilter = true;
				
				var inputSearch = component.get("v.searchInput");
				if (inputSearch != "")
				{
					var datesObj = component.get("v.datesObj");
					if (datesObj.Last6Months == fromDate && datesObj.Today == toDate)
					{
						component.set("v.manualDefaultFlag", true);
					}
				}
			}
		}
		
		// When last 30 days date filter is selected
		if ($("#order-Last-30-Days").prop("checked"))
		{
			var datesObj = component.get("v.datesObj");
			filterObj.last30Days = true;
			filterObj.fromDate = datesObj.Last30Days;
			filterObj.toDate = datesObj.Today;
			filterObj.isFilter = true;
		}
		
		// When last 60 days date filter is selected
		if ($("#order-Last-60-Days").prop("checked"))
		{
			var datesObj = component.get("v.datesObj");
			filterObj.last60Days = true;
			filterObj.fromDate = datesObj.Last60Days;
			filterObj.toDate = datesObj.Today;
			filterObj.isFilter = true;
		}
		
		filterObj.statusList = "";
		
		// When order status Open filter is selected
		if ($("#order-Open").prop("checked"))
		{
			filterObj.orderOpen = true;
			filterObj.statusFilter = true;
			filterObj.isFilter = true;
			filterObj.statusList = "Open";
		}
		
		// When order status Closed filter is selected
		if ($("#order-Closed").prop("checked"))
		{
			filterObj.orderClosed = true;
			filterObj.statusFilter = true;
			filterObj.isFilter = true;
			if (filterObj.statusList == "")
			{
				filterObj.statusList = "Closed";
			}
			else
			{
				filterObj.statusList += ";Closed";
			}
		}
		
		// When order status Cancelled filter is selected
		if ($("#order-Cancelled").prop("checked"))
		{
			filterObj.orderCancelled = true;
			filterObj.statusFilter = true;
			filterObj.isFilter = true;
			if (filterObj.statusList == "")
			{
				filterObj.statusList = "Cancelled";
			}
			else
			{
				filterObj.statusList += ";Cancelled";
			}
		}
		
		component.set("v.orderFilterObj", filterObj);
		
		// When none of date range options is chosen, set the default date range filter
		if (!filterObj.last30Days && !filterObj.last60Days && !filterObj.dateRange)
		{
			this.setDefaultFilter(component, true);
		}
		
		$("#order-filter-button").dropdown('toggle');
		return true;
	},
	
	showHideFilterPills: function(component){
		var filterObj = component.get("v.orderFilterObj");
		
		if (filterObj.last30Days)
		{
			$("#orderPill30Days").show();
			$("#order-Last-30-Days").prop("checked", true);
		}
		else
		{
			$("#orderPill30Days").hide();
			$("#order-Last-30-Days").prop("checked", false);
		}
		if (filterObj.last60Days)
		{
			$("#orderPill60Days").show();
			$("#order-Last-60-Days").prop("checked", true);
		}
		else
		{
			$("#orderPill60Days").hide();
			$("#order-Last-60-Days").prop("checked", false);
		}
		if (filterObj.dateRange)
		{
			var manualDefaultFlag = component.get("v.manualDefaultFlag");
			var datesObj = component.get("v.datesObj");
			if (!manualDefaultFlag && datesObj.Last6Months == filterObj.fromDate && datesObj.Today == filterObj.toDate)
			{
				$("#order-x-range").removeClass("ccp-filter-close").addClass("ccp-filter-close-disabled");
				$("#order-x-range").prop("title", "For more date range options, please use the filters.");
			}
			else
			{
				$("#order-x-range").removeClass("ccp-filter-close-disabled").addClass("ccp-filter-close");
				$("#order-x-range").prop("title", "");
			}
			
			$("#orderPillRangeText").text("Order Date: " + filterObj.fromDateDisplay + " to " + filterObj.toDateDisplay);
			$("#orderPillDateRange").show();
			$("#order-Date-Range").prop("checked", true);
			$("#orderFromDate, #orderToDate").prop('disabled', false);
			$( "#orderFromDate" ).datepicker('setDate', filterObj.fromDateDisplay);
			$( "#orderToDate" ).datepicker('setDate', filterObj.toDateDisplay);
		}
		else
		{
			$("#orderPillDateRange").hide();
			$("#order-Date-Range").prop("checked", false);
			$("#orderFromDate, #orderToDate").prop('disabled', true).val("");
		}
		if (filterObj.orderOpen)
		{
			$("#orderPillOpen").show();
			$("#order-Open").prop("checked", true);
		}
		else
		{
			$("#orderPillOpen").hide();
			$("#order-Open").prop("checked", false);
		}
		if (filterObj.orderClosed)
		{
			$("#orderPillClosed").show();
			$("#order-Closed").prop("checked", true);
		}
		else
		{
			$("#orderPillClosed").hide();
			$("#order-Closed").prop("checked", false);
		}
		if (filterObj.orderCancelled)
		{
			$("#orderPillCancelled").show();
			$("#order-Cancelled").prop("checked", true);
		}
		else
		{
			$("#orderPillCancelled").hide();
			$("#order-Cancelled").prop("checked", false);
		}
		
		if (filterObj.isFilter)
		{
			$("#orderPillClearAll, #orderPillsSection").show();
		}
		else
		{
			$("#orderPillClearAll, #orderPillsSection").hide();
		}
	},
	
    populateOrders : function(component){
		var ordersArr = component.get("v.arrOrdersObj");
        
		if (ordersArr.length > 0)
		{
			$("#orderCarouselSection").html('<div id="orderCView" class="ccp-order-regular"></div>');
			$.each(ordersArr, function( index, value ) {
				var currCard = '<div class="ccp-order-card" id="order-slide-' + index + '" data-slide-num="' + index 
					+ '" data-gon="' + value.GON + '" >';
				
				currCard += '<p><span class="ccp-card-label1" title="Reference number from your Purchase Order document">PO Number</span><br/>';
				currCard += '<span class="ccp-card-label2 ccp-ellipsis" title="' + value.PONumber + '">' + value.PONumber + '</span></p>';
				
				currCard += '<p><span class="ccp-card-label1" title="GE internal reference number of the order generated for your Purchase Order">Order Number</span><br/>';
				currCard += '<span class="ccp-card-label2 ccp-ellipsis" title="' + value.GON + '">' + value.GON + '</span></p>';
				
				currCard += '<p class="ccp-customer-address"><span class="ccp-card-label1" title="Name and shipping address of company placing the order">Shipping Address</span><br/>';
				currCard += '<span class="ccp-card-facility-head ccp-ellipsis" title="' + value.CustomerName + '">' + value.CustomerName + '</span>';
				currCard += '<span class="ccp-card-facility-text ccp-ellipsis" title="' + value.addressLine1 + '">' + value.addressLine1 + '</span>';
				currCard += '<span class="ccp-card-facility-text ccp-ellipsis" title="' + value.addressLine2 + '">' + value.addressLine2 + '</span>';
				currCard += '<span class="ccp-card-facility-text ccp-ellipsis" title="' + value.addressLise3 + '">' + value.addressLise3 + '</span>';
				currCard += '</p>';
				
				currCard += '<p><span class="ccp-card-label1" title="Order date as recorded within GE internal system">Order Date</span><br/>';
				currCard += '<span class="ccp-card-label2">' + value.OrderApprovalDate + '</span></p>';
				
				currCard += '<div class="ccp-card-border"><p class="ccp-card-status-bg"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="Indicates if the order status is open, completed, or cancelled.">Order Status</span><br />';
				currCard += '<span class="ccp-card-label2 ccp-upper-text">' + value.OrderStatus + '</span>';
				currCard += '</span></p></div>';
				
				currCard += '<p><span class="ccp-card-label1" title="Total value of your order">Total Order Value</span><br/>';
				currCard += '<span class="ccp-card-price">' + CCP_formatAmount(value.TotalOrderValue, value.currencyCode) +'</span></p>';
				
				currCard += '<div class="ccp-card-border"><div class="btn ccp-view-details" data-gon="' + value.GON + '"><span>VIEW DETAILS</span>';
				currCard += '<img src="' + $A.get('$Resource.CCP_Resources') + '/assets/images/GoButton.png" alt="Go" class="ccp-gobtn" /></div></div>';
				
				currCard += '</div>';
				
				$("#orderCView").append(currCard);
			});
			
			$("#orderCView").slick({
				adaptiveHeight:false,
				infinite: false,
				slidesToShow: 5,
				slidesToScroll: 5,
				draggable: false,
				responsive: [
					{
						breakpoint: 1281,
						settings: {
							slidesToShow: 4,
							slidesToScroll: 4
						}
					},
					{
						breakpoint: 1025,
						settings: {
							slidesToShow: 3,
							slidesToScroll: 3
						}
					},
					{
						breakpoint: 769,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 2
						}
					},
					{
						breakpoint: 513,
						settings: {
							slidesToShow: 1,
							slidesToScroll: 1,
						}
					}
				]
			});
			
			$("#orderCView .ccp-view-details").on('click', function(event){
				event.stopPropagation();
				var win = window.open('orderdetails?on=' + $(this).data("gon"), '_blank');
				if (win) {
					//Browser has allowed it to be opened
					win.focus();
				} else {
					//Browser has blocked it
					alert('Error: Order details window was unable to open, and may have been blocked by a pop-up blocker. \n\n' + 
						'Please disable your pop-up blocker or add this website to the list of websites your pop-up blocker allows to open new windows.');
				}
			});
			
			$("#orderCView .ccp-order-card").click(function(){
				var GON = $(this).data("gon");
				var activeGON = component.get("v.activeGON");
				var newSlideNum = parseInt($(this).data("slideNum"), 10);
				
				if (activeGON != GON)
				{
					var pageEvent = component.getEvent("pageEvent");
					pageEvent.setParams({"type": "unhighlight"}).fire();
					
					var pageEvent = component.getEvent("pageEvent");
					pageEvent.setParams({"type": "highlight", "pageNum": newSlideNum}).fire();
					
					component.set("v.activeSlideNum", newSlideNum);
					
					var cardEvent = component.getEvent("cardClickEvent");
					cardEvent.setParams({"GON": GON}).fire();
				}
			});
			
			// On before slide change
			$('#orderCView').on('beforeChange', function(event, slick, currentSlide, nextSlide){
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "unhighlight"}).fire();
			});
			
			$('#orderCView').on('setPosition', function(event, slick){
				var swipeFlag = component.get("v.edgeSwipeFlag");
				if (swipeFlag && $("#orderCView").height() < $("#orderCView .slick-list").height())
				{
					var pageEvent = component.getEvent("pageEvent");
					pageEvent.setParams({"type": "reloadCarousel"}).fire();
					return;
				}
				else
				{
					component.set("v.edgeSwipeFlag", false);
				}
				
				var newSlideNum = component.get("v.activeSlideNum");
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "highlight", "pageNum": newSlideNum}).fire();
			});
			
			// On edge hit
			$('#orderCView').on('edge', function(event, slick, direction){
				component.set("v.edgeSwipeFlag", true);
			});
			
			$('#orderCView').on('afterChange', function(event, slick, currentSlide){
				var navFlag = component.get("v.comingFromNavFlag");
				var resizeFlag = component.get("v.comingFromResizeFlag");
				var activeSlideNum = component.get("v.activeSlideNum");
				var swipeFlag = component.get("v.edgeSwipeFlag");
				
				if (!navFlag && !resizeFlag && !swipeFlag)
				{
					activeSlideNum = currentSlide;
					component.set("v.activeSlideNum", currentSlide);
				}
				
				var cardEvent = component.getEvent("cardClickEvent");
				var GON = $( "#order-slide-" + activeSlideNum).data("gon");
				cardEvent.setParams({"GON": GON}).fire();
				
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "rebuildPagination"}).fire();
			});
			
			var activeSlideNum = 0;
			var swipeFlag = component.get("v.edgeSwipeFlag");
			if (swipeFlag)
			{
				component.set("v.edgeSwipeFlag", false);
				activeSlideNum = component.get("v.activeSlideNum");
				$("#orderCView").slick("setOption", "speed", 1, false );
			}
			
			var slidesPerPage = $('#orderCView').slick("slickGetOption", 'slidesToShow');
			if (ordersArr.length <= slidesPerPage)
			{
				var resizeFlag = component.get("v.comingFromResizeFlag");
				if (resizeFlag)
				{
					activeSlideNum = component.get("v.activeSlideNum");
				}
				component.set("v.activeSlideNum", activeSlideNum);
				
				var GON = $( "#order-slide-" + activeSlideNum ).data("gon");
				this.handleCardClick(component, GON);
				this.highlightCard(component, activeSlideNum);
				this.rebuildPagination(component);
			}
			else
			{
				component.set("v.activeSlideNum", activeSlideNum);
				this.navToCurrentSlide(component);
			}
		}
    },
    
    rebuildPagination : function(component){
        var slickObj = $('#orderCView').slick("getSlick");
        var slideCount = slickObj.slideCount;
        var slidesPerPage = slickObj.options.slidesToShow;
        var numOfPages = Math.ceil(slideCount / slidesPerPage);
        
		var activeSlideNum = component.get("v.activeSlideNum");
		var activePageNum = Math.ceil((activeSlideNum + 1) / slidesPerPage);
		component.set("v.activePageNum", activePageNum);
		
		if (slidesPerPage > 1)
		{
			var firstSlideNum = (activePageNum - 1) * slidesPerPage;
			if (activePageNum == numOfPages && numOfPages > 1)
			{
				var slidesOnLastPage =  slideCount % slidesPerPage;
				if (slidesOnLastPage != 0)
				{
					var slidesFromPrevPage = slidesPerPage - slidesOnLastPage;
					firstSlideNum = firstSlideNum - slidesFromPrevPage;
				}
			}
			
			var cnt = slidesPerPage;
			if (slideCount < slidesPerPage)
			{
				cnt = slideCount;
			}
			
			for (i = 0, z = 10, x = firstSlideNum; i < cnt; i++, x++, z--)
			{
				$("#order-slide-" + x).removeClass("ccp-z-index-1 ccp-z-index-2 ccp-z-index-3 ccp-z-index-4 ccp-z-index-5 ccp-z-index-6 ccp-z-index-7 ccp-z-index-8 ccp-z-index-9 ccp-z-index-10");
				$("#order-slide-" + x).addClass("ccp-z-index-" + z);
			}
		}
		
        var pageStr = "";
		var beforeFlag = false;
		var afterFlag = false;
        for (i = 1; i <= numOfPages; i++)
        {
            if (i == 1)
            {
                if (activePageNum == 1)
				{
					pageStr += "<li><a class='ccp-page-disable'>PREVIOUS</a></li>";
					$("#orderCView .slick-prev").prop("disabled", true);
				}
				else
				{
					pageStr += "<li><a id='order-prev' class='ccp-page-no ccp-label' onclick='return false;' aria-label='Previous'><span aria-hidden='true'>PREVIOUS</span></a></li>";
					$("#orderCView .slick-prev").prop("disabled", false);
				}
				
				if (i == activePageNum)
				{
					pageStr += "<li><a class='ccp-page-no ccp-page-active'>" + i + "</a></li>";
				}
				else
				{
					pageStr += "<li><a class='order-page ccp-page-no' id='order-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
				}
				
				if (numOfPages == 1)
				{
					pageStr += "<li><a class='ccp-page-disable'>NEXT</a></li>";
					$("#orderCView .slick-next").prop("disabled", true);
				}
            }
            else if (i == numOfPages)
            {
				if (i == activePageNum)
				{
					pageStr += "<li><a class='ccp-page-no ccp-page-active'>" + i + "</a></li>";
				}
				else
				{
					pageStr += "<li><a class='order-page ccp-page-no' id='order-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
				}
				
				if (activePageNum == numOfPages)
				{
					pageStr += "<li><a class='ccp-page-disable'>NEXT</a></li>";
					$("#orderCView .slick-next").prop("disabled", true);
				}
				else
				{
					pageStr += " <li><a id='order-next' class='ccp-page-no ccp-label' onclick='return false;' aria-label='Next'><span aria-hidden='true'>NEXT</span></a></li>";
					$("#orderCView .slick-next").prop("disabled", false);
				}
            }
			else
			{
				if ( numOfPages <= 5
					|| (activePageNum == 1 && i <= 3)
					|| (activePageNum == 4 && i == 2)
					|| ((activePageNum == numOfPages - 3) && (numOfPages - i == 1))
					|| (activePageNum == numOfPages && (numOfPages - i <= 2))
					|| ((i == activePageNum) || (i == activePageNum - 1) || (i == activePageNum + 1)))
				{
					if (i == activePageNum)
					{
						pageStr += "<li><a class='ccp-page-no ccp-page-active'>" + i + "</a></li>";
					}
					else
					{
						pageStr += "<li><a class='order-page ccp-page-no' id='order-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
					}
				}	
				else
				{
					if (i < activePageNum && !beforeFlag)
					{
						pageStr += "<li>...</li>";
						beforeFlag = true;
					}
					else if (i > activePageNum && !afterFlag)
					{
						pageStr += "<li>...</li>";
						afterFlag = true;
					}
				}
			}
        }
		
        $("#orderPages").html(pageStr);
        
		$("#orderPages a.order-page.ccp-page-no").on("click", function(){
            var pageEvent = component.getEvent("pageEvent");
			var pageNum = $(this).data("page");
            pageEvent.setParams({"type": "page", "pageNum": pageNum}).fire();
        });
		
		$("#order-prev").on("click", function(){
            var pageEvent = component.getEvent("pageEvent");
            pageEvent.setParams({"type": "previous"}).fire();
        });
		
		$("#order-next").on("click", function(){
            var pageEvent = component.getEvent("pageEvent");
            pageEvent.setParams({"type": "next"}).fire();
        });
		
		component.set("v.comingFromNavFlag", false);
		component.set("v.comingFromResizeFlag", false);
    },
    
	navToCurrentSlide : function(component){
		component.set("v.comingFromNavFlag", true);
		
		var resizeFlag = component.get("v.comingFromResizeFlag");
		if (resizeFlag)
		{
			var slickObj = $('#orderCView').slick("getSlick");
			var slidesPerPage = slickObj.options.slidesToShow;
			var slideCount = slickObj.slideCount;
			
			if (slideCount <= slidesPerPage)
			{
				this.reloadCarousel(component, true);
				return;
			}
		}
		
		var activeSlideNum = component.get("v.activeSlideNum");
		
		$("#orderCView").slick("slickGoTo", activeSlideNum, false);
		$("#orderCView").slick("setOption", "speed", 300, false );
	},
	
    navToCardPage : function(component, eType, pageNum){
		var slickObj = $('#orderCView').slick("getSlick");
		var slidesPerPage = slickObj.options.slidesToShow;
        var slideCount = slickObj.slideCount;
        var numOfPages = Math.ceil(slideCount / slidesPerPage);
		
		var newPageNum;
		
		if (eType == "page")
		{
			newPageNum = pageNum;
		}
		else
		{
			var activePageNum = component.get("v.activePageNum");
			
			if (eType == "previous")
			{
				newPageNum = activePageNum - 1;
			}
			else
			{
				newPageNum = activePageNum + 1;
			}
		}
		
		if (newPageNum < 1 || newPageNum > numOfPages)
		{
			return;
		}
		
		var newSlideNum = (newPageNum - 1) * slidesPerPage;
		
		component.set("v.activeSlideNum", newSlideNum);
		this.navToCurrentSlide(component);
    },
	
	handleCardClick : function(component, GON){
		var activeGON = component.get("v.activeGON");
		if (activeGON != GON)
		{
			component.set("v.activeGON", GON);
			var fetchInvoices = $A.get("e.c:CCP_fetchInvoices");
			fetchInvoices.setParams({ "GON": GON }).fire();
		}
	},
	
	reloadCarousel : function(component, repopulate){
		$("#orderCView").slick("unslick");
		$("#orderCView").remove();
		if (repopulate)
		{
			this.populateOrders(component);
		}
	},
	
	highlightCard : function(component, slideNum){
		$("#order-slide-" + slideNum).addClass("ccp-orders-active-card");
	},
	
	unhighlightCards : function(component){
		$("#orderCView .ccp-orders-active-card").removeClass("ccp-orders-active-card");
    }
})