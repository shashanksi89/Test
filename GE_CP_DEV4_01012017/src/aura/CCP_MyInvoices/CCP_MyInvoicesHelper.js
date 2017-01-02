({
	// Fetch the key dates from Apex and store in date object to use later
	createDatesArray : function(component){
        var action = component.get("c.createDatesArray");	
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                component.set("v.datesObj", response.getReturnValue());
            }
			else if (state === "ERROR"){
                this.showError(component, "invoice", "exception");
            }
        });
        $A.enqueueAction(action);
    },
	
	showError : function(component, errSource, errType) {
		var loaderDiv = errSource + "LoadInfo";
		var errorDiv = errSource + "ErrorSection";
		var errMsg;
		if (errType == "invalid")
		{
			errMsg = "Details are not available for this order.";
		}
		else
		{
			if (errSource == "invoice")
			{
				errMsg = "An error occurred while loading invoices.<br />";
			}
			else
			{
				errMsg = "An error occurred while loading order details.<br />";
			}
			errMsg += "Kindly visit Contact Us page and provide necessary information.";
		}
		
		var scriptFlag = component.get("v.scriptFlag");
		if (scriptFlag)
		{
			// Hide load spinner
			$("#" + loaderDiv).hide();
			
			// Show the error message
			$("#" + errorDiv).html(errMsg).show();
		}
		else
		{
			document.getElementById(loaderDiv).style.display = "none";
			document.getElementById(errorDiv).innerHTML = errMsg;
			document.getElementById(errorDiv).style.display = "block";
		}
	},
	
	setDefaultFilter : function(component, useExisting){
		$("#invoice-Date-Range").prop("checked", true);
		$("#invoiceFromDate, #invoiceToDate").prop('disabled', false);
		
		var datesObj = component.get("v.datesObj");
		$( "#invoiceFromDate" ).datepicker('setDate', datesObj.Last6MonthsDisplay);
		$( "#invoiceToDate" ).datepicker('setDate', datesObj.TodayDisplay);
		
		var filterObj;
		if (useExisting)
		{
			filterObj = component.get("v.invoiceFilterObj");
		}
		else
		{
			filterObj = {};
		}
		
		filterObj.fromDate = $("#invoiceFromAltDate").val();
		filterObj.fromDateDisplay = $("#invoiceFromDate").val();
		filterObj.toDate = $("#invoiceToAltDate").val();
		filterObj.toDateDisplay = $("#invoiceToDate").val();
		filterObj.dateRange = true;
		filterObj.isFilter = true;
		
		component.set("v.invoiceFilterObj", filterObj);
		component.set("v.manualDefaultFlag", false);
	},
	
	// Code to fetch the invoices for the first time at page load
    firstInvoiceFetch : function(component) {
		// Call Apex method and pass default search/sort/filter and offset params
        var sortType = component.get("v.invoiceSortType");
        var sortOrder = component.get("v.invoiceSortOrder");
		var action = component.get("c.fetchMyInvoicesJSON");
		var currentOffset = 0;
        action.setParams({
            "inputSearch": "",
            "sortType": sortType,
			"sortOrder": sortOrder,
			"fromDate": "",
			"toDate": "",
			"invoiceStatusFilter": "",
			"offset": currentOffset,
			"defaultDateFlag": true
        });
		
		// Defined the callback of Apex method call
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
				var retVal = response.getReturnValue();
				component.set("v.totalRecords", parseInt(retVal["totalRecords"], 10));
				component.set("v.invoiceWrappersJSON", retVal["invoices"]);
				component.set("v.currentOffset", currentOffset);
				component.set("v.chunkSize", parseInt(retVal["chunkSize"], 10));
                component.set("v.dataFlag", true);
				// Initialize carousel display
                this.initDisplay(component);
            }
			else if (state === "ERROR"){
                this.showError(component, "invoice", "exception");
            }
		});
        $A.enqueueAction(action);
	},
	
	// Initialize Carousel Display
    initDisplay : function(component) {
        var dataFlag = component.get("v.dataFlag");
        var scriptFlag = component.get("v.scriptFlag");
		var renderFlag = component.get("v.initialLoad");
		
		// Check if data and carousel both are ready
        if (dataFlag && scriptFlag && renderFlag)
        {
			var invoicesArr = JSON.parse(component.get("v.invoiceWrappersJSON"));
            component.set("v.arrInvoicesObj", invoicesArr);
            
			// Enable search/sort/filter
			$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", false);
			$("#invoiceSort").selectpicker('refresh');
			// Show the applicable filter pills
			this.showHideFilterPills(component);
			
			// When no data is returned, display error message
            if (!invoicesArr || invoicesArr.length == 0)
            {
				$("#invoiceErrorSection").text("Your filter did not yield any matching invoices.").show();
            }
			// Display carousel when data is returned
            else
            {
				// Populated carousel with the available invoice data
				this.populateInvoices(component);
            }
			
			// Hide load animation
			$("#invoiceLoadInfo").hide();
        }
    },
	
	// Function to fetch the search results, sorted & filtered results and paginated datasets from server
	repeatInvoiceFetch : function(component, currentOffset) {
        // Check for search input
		var inputSearch = component.get("v.searchInput");
        
		// Check for applied sort
		var sortType = component.get("v.invoiceSortType");
		var sortOrder = component.get("v.invoiceSortOrder");
		
		// Check for applied filters
		var filterObj = component.get("v.invoiceFilterObj");
		var fromDate = "";
		var toDate = "";
		var invoiceStatusFilter = "";
		
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
						
						var newFilterObj = component.get("v.invoiceFilterObj");
						newFilterObj.fromDate = "";
						newFilterObj.fromDateDisplay = "";
						newFilterObj.toDate = "";
						newFilterObj.toDateDisplay = "";
						newFilterObj.dateRange = false;
						
						if (!newFilterObj.statusFilter)
						{
							newFilterObj.isFilter = false;
						}
						
						component.set("v.invoiceFilterObj", newFilterObj);
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
				invoiceStatusFilter = filterObj.statusList;
			}
		}
		
		// Call Apex method and pass all required params for search/sort/filter and pagination
		var action = component.get("c.fetchMyInvoicesJSON");
        action.setParams({
            "inputSearch": inputSearch,
            "sortType": sortType,
			"sortOrder": sortOrder,
			"fromDate": fromDate,
			"toDate": toDate,
			"invoiceStatusFilter": invoiceStatusFilter,
			"offset": currentOffset,
			"defaultDateFlag": defaultDateFilter
        });
		// Defined the callback of Apex method call
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
				var retVal = response.getReturnValue();
				component.set("v.totalRecords", parseInt(retVal["totalRecords"], 10));
				component.set("v.invoiceWrappersJSON", retVal["invoices"]);
				component.set("v.currentOffset", currentOffset);
				
				var invoicesArr = JSON.parse(retVal["invoices"]);
				component.set("v.arrInvoicesObj", invoicesArr);
				
				// Hide load spinner
				$("#invoiceLoadInfo").hide();
				// Enable search/sort/filter
				$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", false);
				$("#invoiceSort").selectpicker('refresh');
				// Show the applicable filter pills
				this.showHideFilterPills(component);
				
				// Populate carousel when there is data returned
				if (invoicesArr.length > 0)
				{
					this.populateInvoices(component);
				}
				// When no data is returned, display appropriate error message
				else
				{
					if (inputSearch != "")
					{
						$("#invoiceErrorSection").text("Your search did not yield any matching invoices.").show();
					}
					else if ((fromDate != "" && toDate != "" ) || invoiceStatusFilter != "")
					{
						$("#invoiceErrorSection").text("Your filter did not yield any matching invoices.").show();
					}
					else
					{
						$("#invoiceErrorSection").text("No invoices were found.").show();
					}
					
					component.set("v.activeSlideNum", -1);
				}
            }
			else if (state === "ERROR"){
                this.showError(component, "invoice", "exception");
            }
		});
        $A.enqueueAction(action);
		
		// While submitting the apex call - perform the following required activites
		// Show load spinner
		$("#invoiceLoadInfo").show();
		// Set the correct value in the search box
		$("#invoiceSearchText").val(inputSearch);
		// Remove existing carousel
		this.reloadCarousel(component, false);
		// Disable search/sort/filter
		$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", true);
		$("#invoiceSort").selectpicker('refresh');
		// Remove existing pagination
		$("#invoicePages").html("");
		// Hide any error messages
		$("#invoiceErrorSection").text("").hide();
		// Hide filter pills and Order details section
		$("#invoicePillsSection, #orderDetailsSection").hide();
		component.set("v.activeGON", "");
	},
	
	// Check applied filters and update the filter object
	checkFilters: function(component){
	    var filterObj = {};
		filterObj.isFilter = false;
		
		// When date range filter is selected
		if ($("#invoice-Date-Range").prop("checked"))
		{
			var fromDateDisplay = $("#invoiceFromDate").val();
			var toDateDisplay = $("#invoiceToDate").val();
			
			if (!fromDateDisplay || !toDateDisplay)
			{
				alert("Error: Please choose From and To dates for the date range filter.");
				return false;
			}
			else
			{
				var fromDate = $("#invoiceFromAltDate").val();
				var toDate = $("#invoiceToAltDate").val();
				
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
				filterObj.fromDateDisplay = $("#invoiceFromDate").val();
				filterObj.toDate = toDate;
				filterObj.toDateDisplay = $("#invoiceToDate").val();
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
		if ($("#invoice-Last-30-Days").prop("checked"))
		{
			var datesObj = component.get("v.datesObj");
			filterObj.last30Days = true;
			filterObj.fromDate = datesObj.Last30Days;
			filterObj.toDate = datesObj.Today;
			filterObj.isFilter = true;
		}
		
		// When last 60 days date filter is selected
		if ($("#invoice-Last-60-Days").prop("checked"))
		{
			var datesObj = component.get("v.datesObj");
			filterObj.last60Days = true;
			filterObj.fromDate = datesObj.Last60Days;
			filterObj.toDate = datesObj.Today;
			filterObj.isFilter = true;
		}
		
		filterObj.statusList = "";
		
		// When invoice status Open filter is selected
		if ($("#invoice-Open").prop("checked"))
		{
			filterObj.invoiceOpen = true;
			filterObj.statusFilter = true;
			filterObj.isFilter = true;
			filterObj.statusList = "Open";
		}
		
		// When invoice status Closed filter is selected
		if ($("#invoice-Closed").prop("checked"))
		{
			filterObj.invoiceClosed = true;
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
		
		component.set("v.invoiceFilterObj", filterObj);
		
		// When none of date range options is chosen, set the default date range filter
		if (!filterObj.last30Days && !filterObj.last60Days && !filterObj.dateRange)
		{
			this.setDefaultFilter(component, true);
		}
		
		$("#invoice-filter-button").dropdown('toggle');
		return true;
	},
	
	// Show or hide the filter pills based on the currently selected filters
	showHideFilterPills: function(component){
		var filterObj = component.get("v.invoiceFilterObj");
		
		if (filterObj.last30Days)
		{
			$("#invoicePill30Days").show();
			$("#invoice-Last-30-Days").prop("checked", true);
		}
		else
		{
			$("#invoicePill30Days").hide();
			$("#invoice-Last-30-Days").prop("checked", false);
		}
		if (filterObj.last60Days)
		{
			$("#invoicePill60Days").show();
			$("#invoice-Last-60-Days").prop("checked", true);
		}
		else
		{
			$("#invoicePill60Days").hide();
			$("#invoice-Last-60-Days").prop("checked", false);
		}
		if (filterObj.dateRange)
		{
			var manualDefaultFlag = component.get("v.manualDefaultFlag");
			var datesObj = component.get("v.datesObj");
			if (!manualDefaultFlag && datesObj.Last6Months == filterObj.fromDate && datesObj.Today == filterObj.toDate)
			{
				$("#invoice-x-range").removeClass("ccp-filter-close").addClass("ccp-filter-close-disabled");
				$("#invoice-x-range").prop("title", "For more date range options, please use the filters.");
			}
			else
			{
				$("#invoice-x-range").removeClass("ccp-filter-close-disabled").addClass("ccp-filter-close");
				$("#invoice-x-range").prop("title", "");
			}
			
			$("#invoicePillRangeText").text("Invoice Date: " + filterObj.fromDateDisplay + " to " + filterObj.toDateDisplay);
			$("#invoicePillDateRange").show();
			$("#invoice-Date-Range").prop("checked", true);
			$("#invoiceFromDate, #invoiceToDate").prop('disabled', false);
			$( "#invoiceFromDate" ).datepicker('setDate', filterObj.fromDateDisplay);
			$( "#invoiceToDate" ).datepicker('setDate', filterObj.toDateDisplay);
		}
		else
		{
			$("#invoicePillDateRange").hide();
			$("#invoice-Date-Range").prop("checked", false);
			$("#invoiceFromDate, #invoiceToDate").prop('disabled', true).val("");
		}
		if (filterObj.invoiceOpen)
		{
			$("#invoicePillOpen").show();
			$("#invoice-Open").prop("checked", true);
		}
		else
		{
			$("#invoicePillOpen").hide();
			$("#invoice-Open").prop("checked", false);
		}
		if (filterObj.invoiceClosed)
		{
			$("#invoicePillClosed").show();
			$("#invoice-Closed").prop("checked", true);
		}
		else
		{
			$("#invoicePillClosed").hide();
			$("#invoice-Closed").prop("checked", false);	
		}
		
		// Show the clear all button and pill section when at least one filter is applied
		if (filterObj.isFilter)
		{
			$("#invoicePillClearAll, #invoicePillsSection").show();
		}
		// When no filter is applied, hide the clear all button and pill section 
		else
		{
			$("#invoicePillClearAll, #invoicePillsSection").hide();
		}
	},
	
	// Populate the carousel with the invoices in the current dataset
	populateInvoices : function(component){
		var invoicesArr = component.get("v.arrInvoicesObj");
        
		if (invoicesArr.length > 0)
		{
			// Create cards for all the invoices in the current dataset
			$("#invoiceCarouselSection").html('<div id="invoiceCView" class="ccp-invoice-regular"></div>');
			$.each(invoicesArr, function( index, value ) {
				var currCard = '<div class="ccp-invoice-card" id="invoice-slide-' + index + '" data-slide-num="' + index 
					+ '" data-gon="' + value.GON + '" data-inv="' + value.InvoiceNumber + '" data-fset="' + value.FSetNumber + '" >';
				
				currCard += '<p><span class="ccp-card-label1" title="Reference number of invoice">Invoice Number</span><br/>';
				currCard += '<span class="ccp-invoice-num ccp-ellipsis" title="' + value.InvoiceNumber + '">' + value.InvoiceNumber + '</span></p>';
				
				currCard += '<p><span class="ccp-card-label1" title="Date invoice was generated by GE">Invoice Date</span><br/>';
				currCard += '<span class="ccp-card-label2">' + value.InvoiceDate + '</span></p>';
				
				currCard += '<p><span class="ccp-card-label1" title="Reference number of the Purchase Order placed by you">PO Number</span><br/>';
				currCard += '<span class="ccp-card-label2 ccp-ellipsis" title="' + value.PONumber + '">' + value.PONumber + '</span></p>';
				
				currCard += '<p><span class="ccp-card-label1" title="GE internal reference number of the order generated for your Purchase Order">Order Number</span><br/>';
				currCard += '<span class="ccp-card-label2 ccp-ellipsis" title="' + value.GON + '">' + value.GON + '</span></p>';
				
				currCard += '<p><span class="ccp-card-label1" title="Amount billed on a specific invoice">Invoice Amount</span><br />';
				currCard += '<span class="ccp-card-price">' + CCP_formatAmount(value.InvoiceAmount, value.currencyCode) +'</span></p>';
				
				currCard += '<p><span class="ccp-card-label1" title="Invoice amount pending payment">Invoice Due Amount</span><br />';
				currCard += '<span class="ccp-card-price">' + CCP_formatAmount(value.InvoiceDueAmount, value.currencyCode) +'</span></p>';
				
				currCard += '<p><span class="ccp-card-label1" title="Date by which payment is contractually expected">Payment Due Date</span><br/>';
				currCard += '<span class="ccp-card-label2">' + value.PaymentDueDate + '</span></p>';
				
				currCard += '<p><span class="ccp-card-label1" title="Indicates if entire invoice amount has been paid">Invoice Status</span><br />';
				currCard += '<span class="ccp-card-label2 ccp-upper-text">' + value.InvoiceStatus + '</span></p>';
				
				currCard += '<div class="ccp-invoice-bottom-pad"> <div class="ccp-invoice-bottom"> </div></div>';
				currCard += '</div>';
				
				$("#invoiceCView").append(currCard);
			});
			
			// Initialize carousel
			$("#invoiceCView").slick({
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
			
			// Click handler for the invoice cards
			$("#invoiceCView .ccp-invoice-card").click(function(){
				var activeSlideNum = component.get("v.activeSlideNum");
				var newSlideNum = parseInt($(this).data("slideNum"), 10);
				
				// In case a different slide is clicked
				if (activeSlideNum != newSlideNum)
				{
					// Unhighlight already highlighted cards
					var pageEvent = component.getEvent("pageEvent");
					pageEvent.setParams({"type": "unhighlight"}).fire();
					
					// Highlight the current card
					var pageEvent = component.getEvent("pageEvent");
					pageEvent.setParams({"type": "highlight", "pageNum": newSlideNum}).fire();
					
					component.set("v.activeSlideNum", newSlideNum);
					
					// Fire card click event so that corresponding order details can be loaded
					var GON = $(this).data("gon");
					var inv = $(this).data("inv");
					var fset = $(this).data("fset");
					var cardEvent = component.getEvent("cardClickEvent");
					cardEvent.setParams({"GON": GON, "InvNum": inv, "FSetNum": fset}).fire();
				}
			});
			
			// Handler for on before slide change event - carousel event
			$('#invoiceCView').on('beforeChange', function(event, slick, currentSlide, nextSlide){
				// Unhighlight already highlighted cards
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "unhighlight"}).fire();
			});
			
			// Handler for set position event - carousel event
			$('#invoiceCView').on('setPosition', function(event, slick){
				// If edge swipe flag is true, reload the carousel to overcome the carousel defect of showing multiple rows
				var swipeFlag = component.get("v.edgeSwipeFlag");
				if (swipeFlag && $("#invoiceCView").height() < $("#invoiceCView .slick-list").height())
				{
					var pageEvent = component.getEvent("pageEvent");
					pageEvent.setParams({"type": "reloadCarousel"}).fire();
					return;
				}
				else
				{
					component.set("v.edgeSwipeFlag", false);
				}
				
				// Highlight the active card
				var newSlideNum = component.get("v.activeSlideNum");
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "highlight", "pageNum": newSlideNum}).fire();
			});
			
			// Handler for edge hit event while swiping on a touch enable device - carousel event
			$('#invoiceCView').on('edge', function(event, slick, direction){
				// Offset value of current dataset
				var currentOffset = component.get("v.currentOffset");
				var slickObj = $('#invoiceCView').slick("getSlick");
				// Number of slide per carousel page
				var slidesPerPage = slickObj.options.slidesToShow;
				// Number of carousel slides in current dataset
				var slideCount = slickObj.slideCount;
				// Number of carousel slides in all the records
				var slideCountFull = component.get("v.totalRecords");
				// Number of carousel pages in current dataset
				var numOfPages = Math.ceil(slideCount / slidesPerPage);
				// Number of carousel pages in all the records 
				var numOfPagesFull = Math.ceil(slideCountFull / slidesPerPage);
				// Slide number in current dataset
				var activeSlideNum = component.get("v.activeSlideNum");
				// Slide number in all the records
				var activeSlideNumFull = component.get("v.activeSlideNum") + currentOffset;
				// Page number for the active page in current dataset
				var activePageNum = Math.ceil((activeSlideNum + 1) / slidesPerPage);
				// Page number for the active page in all the records
				var activePageNumFull = Math.ceil((activeSlideNumFull + 1) / slidesPerPage);
				
				// When swiping to the right
				if (direction == "right")
				{
					// If active page is overall first page, set the edge swipe flag to tackle carousel bug
					if (activePageNumFull == 1)
					{
						component.set("v.edgeSwipeFlag", true);
					}
					// If active page is first page in current dataset but not in all records, fetch the previous dataset
					else if (activePageNum == 1)
					{
						var pageEvent = component.getEvent("pageEvent");
						pageEvent.setParams({"type": "previous"}).fire();
					}
				}
				// When swiping to the left
				else if (direction == "left")
				{
					// If active page is overall last page, set the edge swipe flag to tackle carousel bug
					if (activePageNumFull == numOfPagesFull || numOfPagesFull == component.get("v.activePageNum"))
					{
						component.set("v.edgeSwipeFlag", true);
					}
					// If active page is last page in current dataset but not in all records, fetch the next dataset
					else if (activePageNum == numOfPages)
					{
						var pageEvent = component.getEvent("pageEvent");
						pageEvent.setParams({"type": "next"}).fire();
					}
				}
			});
			
			// Handler for after slide change event - carousel event
			$('#invoiceCView').on('afterChange', function(event, slick, currentSlide){
				var navFlag = component.get("v.comingFromNavFlag");
				var resizeFlag = component.get("v.comingFromResizeFlag");
				var activeSlideNum = component.get("v.activeSlideNum");
				var swipeFlag = component.get("v.edgeSwipeFlag");
				
				// If not coming from pagination, resize or edge swipe, use the default carousel active slide - otherwise use already set active slide
				if (!navFlag && !resizeFlag && !swipeFlag)
				{
					activeSlideNum = currentSlide;
					component.set("v.activeSlideNum", currentSlide);
				}
				
				// Fire card click event to load corresponding order details
				var GON = $( "#invoice-slide-" + activeSlideNum).data("gon");
				var inv = $( "#invoice-slide-" + activeSlideNum).data("inv");
				var fset = $( "#invoice-slide-" + activeSlideNum).data("fset");
				var cardEvent = component.getEvent("cardClickEvent");
				cardEvent.setParams({"GON": GON, "InvNum": inv, "FSetNum": fset}).fire();
				
				// Rebuild pagination
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "rebuildPagination"}).fire();
			});
			
			// Logic to move to a certain slide be default on carousel load
			var slickObj = $('#invoiceCView').slick("getSlick");
			var slidesPerPage = slickObj.options.slidesToShow;
			var serverPageFlag = component.get("v.serverPageFlag");
			
			// If coming from server side pagination, use the already defined page to navigate to
			if (serverPageFlag)
			{
				var newPageNum = component.get("v.serverPageNum");
				var chunkSize = component.get("v.chunkSize");
				var numOfPages = Math.ceil(chunkSize / slidesPerPage);
				
				// If the target page is not part of the first dataset, find out the page number for the target page in the current dataset
				if (!(newPageNum >= 1 && newPageNum <= numOfPages))
				{
					if (slidesPerPage == 1)
					{
						newPageNum = newPageNum % chunkSize;
						
						if (newPageNum == 0)
						{
							newPageNum = chunkSize;
						}
					}
					else
					{
						newPageNum = newPageNum % numOfPages;
						
						if (newPageNum == 0)
						{
							newPageNum = numOfPages;
						}
					}
				}
				
				// Calculate the slide number of the first slide on the target page
				var activeSlideNum = (newPageNum - 1) * slidesPerPage;
				component.set("v.activeSlideNum", activeSlideNum);
				component.set("v.serverPageFlag", false);
				
				// In case the number of slides is less than or equal to the number of slides on a page
				if (invoicesArr.length <= slidesPerPage)
				{
					// Call highlight, card click and rebuild pagination explicitly.
					var GON = $( "#invoice-slide-" + activeSlideNum ).data("gon");
					var inv = $( "#invoice-slide-" + activeSlideNum).data("inv");
					var fset = $( "#invoice-slide-" + activeSlideNum).data("fset");
					
					this.handleCardClick(component, GON, inv, fset);
					this.highlightCard(component, activeSlideNum);
					this.rebuildPagination(component);
				}
				// Move to the target slide, which will implicitly call highlight, card click and rebuild pagination.
				else
				{
					this.navToCurrentSlide(component);
				}
			}
			// If not coming from server side pagination, determine the target slide
			else
			{
				// First slide in the current dataset is default
				var activeSlideNum = 0;
				
				// In case of edge swipe flag, target slide is the already active slide (carousel bug)
				var swipeFlag = component.get("v.edgeSwipeFlag");
				if (swipeFlag)
				{
					component.set("v.edgeSwipeFlag", false);
					activeSlideNum = component.get("v.activeSlideNum");
					$("#invoiceCView").slick("setOption", "speed", 1, false );
				}
				
				// In case the number of slides is less than or equal to the number of slides on a page
				if (invoicesArr.length <= slidesPerPage)
				{
					// In case of resize flag, target slide is the already active slide
					var resizeFlag = component.get("v.comingFromResizeFlag");
					if (resizeFlag)
					{
						activeSlideNum = component.get("v.activeSlideNum");
					}
					component.set("v.activeSlideNum", activeSlideNum);
					
					// Call highlight, card click and rebuild pagination explicitly.
					var GON = $( "#invoice-slide-" + activeSlideNum ).data("gon");
					var inv = $( "#invoice-slide-" + activeSlideNum).data("inv");
					var fset = $( "#invoice-slide-" + activeSlideNum).data("fset");
					
					this.handleCardClick(component, GON, inv, fset);
					this.highlightCard(component, activeSlideNum);
					this.rebuildPagination(component);
				}
				else
				{
					// Move to the target slide, which will implicitly call highlight, card click and rebuild pagination.
					component.set("v.activeSlideNum", activeSlideNum);
					this.navToCurrentSlide(component);
				}
			}
		}
    },
	
	// Build the hybrid pagination (combination of server side and client side paginations) for the carousel
	rebuildPagination : function(component){
		// Offset value of current dataset
		var currentOffset = component.get("v.currentOffset");
		// Size of each dataset
		var chunkSize = component.get("v.chunkSize");
		var slickObj = $('#invoiceCView').slick("getSlick");
        // Number of slide per carousel page
		var slidesPerPage = slickObj.options.slidesToShow;
		// Number of carousel slides in current dataset
		var slideCount = slickObj.slideCount;
		// Number of carousel slides in all the records
        var slideCountFull = component.get("v.totalRecords");
		// Number of carousel pages in current dataset
        var numOfPages = Math.ceil(slideCount / slidesPerPage);
		// Number of carousel pages in all the records 
        var numOfPagesFull = Math.ceil(slideCountFull / slidesPerPage);
		// Slide number in current dataset
		var activeSlideNum = component.get("v.activeSlideNum");
		// Slide number in all the records
		var activeSlideNumFull = component.get("v.activeSlideNum") + currentOffset;
		// Page number for the active page in current dataset
		var activePageNum = Math.ceil((activeSlideNum + 1) / slidesPerPage);
		// Page number for the active page in all the records
		var activePageNumFull = Math.ceil((activeSlideNumFull + 1) / slidesPerPage);
		
		component.set("v.activePageNum", activePageNumFull);
		
		// Code to set z-index in the current carousel page so that first card overlaps second, second overlaps third and so on...
		if (slidesPerPage > 1)
		{
			// Find out the first slide number being displayed on the current carousel page
			var firstSlideNum = (activePageNum - 1) * slidesPerPage;
			if (activePageNumFull == numOfPagesFull && numOfPagesFull > 1)
			{
				var slidesOnLastPage =  slideCountFull % slidesPerPage;
				if (slidesOnLastPage != 0)
				{
					var slidesFromPrevPage = slidesPerPage - slidesOnLastPage;
					firstSlideNum = firstSlideNum - slidesFromPrevPage;
				}
			}
			
			// Find out the number of slides on current page
			var cnt = slidesPerPage;
			if (slideCount < slidesPerPage)
			{
				cnt = slideCount;
			}
			
			// Set z-index of all the slides on the current page in decreasing order
			for (i = 0, z = 10, x = firstSlideNum; i < cnt; i++, x++, z--)
			{
				$("#invoice-slide-" + x).removeClass("ccp-z-index-1 ccp-z-index-2 ccp-z-index-3 ccp-z-index-4 ccp-z-index-5 ccp-z-index-6 ccp-z-index-7 ccp-z-index-8 ccp-z-index-9 ccp-z-index-10");
				$("#invoice-slide-" + x).addClass("ccp-z-index-" + z);
			}
		}
		
		// Remove the dummy carousel left and right arrows
		$("#dummy-invoice-next, #dummy-invoice-prev").off();
		$("#dummy-invoice-next, #dummy-invoice-prev").remove();
		
        var pageStr = "";
		var beforeFlag = false;
		var afterFlag = false;
        for (i = 1; i <= numOfPagesFull; i++)
        {
			// first page
            if (i == 1)
            {
				// If currently active page is the overall first page, disable previous button
                if (activePageNumFull == 1)
				{
					pageStr += "<li><a class='ccp-page-disable'>PREVIOUS</a></li>";
					$("#invoiceCView .slick-prev").show();
					$("#invoiceCView .slick-prev").prop("disabled", true);
				}
				else
				{
					// Create enabled previous link
					pageStr += "<li><a id='invoice-prev' class='ccp-page-no ccp-label' onclick='return false;' aria-label='Previous'><span aria-hidden='true'>PREVIOUS</span></a></li>";
					
					// If currently active page is first page in current dataset but not the first page in all the records, replace the default carousel left arrow with a replica, so that previous dataset can be loaded
					if (activePageNum == 1)
					{
						$("#invoiceCView .slick-prev").hide();
						
						var dummyPrevButton = '<button type="button" id="dummy-invoice-prev" data-role="none" class="slick-prev slick-arrow" aria-label="Previous" role="button" aria-disabled="false" style="display: block;">Previous</button>';
						$(".ccp-invoice-regular").append(dummyPrevButton);
					}
					// Show the default carousel arrows when currently active page is not the first page in current dataset or in all the records 
					else
					{
						$("#invoiceCView .slick-prev").show();
						$("#invoiceCView .slick-prev").prop("disabled", false);
					}
				}
				
				// Create the Page Number 1 link
				if (i == activePageNumFull)
				{
					pageStr += "<li><a class='ccp-page-no ccp-page-active'>" + i + "</a></li>";
				}
				else
				{
					pageStr += "<li><a class='invoice-page ccp-page-no' id='invoice-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
				}
				
				// If only one page, also show the disabled NEXT link
				if (numOfPagesFull == 1)
				{
					pageStr += "<li><a class='ccp-page-disable'>NEXT</a></li>";
					$("#invoiceCView .slick-next").prop("disabled", true);
				}
            }
			// last page
            else if (i == numOfPagesFull)
            {
				// Create the Last Page Number link
				if (i == activePageNumFull)
				{
					pageStr += "<li><a class='ccp-page-no ccp-page-active'>" + i + "</a></li>";
				}
				else
				{
					pageStr += "<li><a class='invoice-page ccp-page-no' id='invoice-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
				}
				
				// If currently active page is the overall last page, disable next button
				if (activePageNumFull == numOfPagesFull)
				{
					pageStr += "<li><a class='ccp-page-disable'>NEXT</a></li>";
					$("#invoiceCView .slick-next").show();
					$("#invoiceCView .slick-next").prop("disabled", true);
				}
				else
				{
					// Create enabled next link
					pageStr += " <li><a id='invoice-next' class='ccp-page-no ccp-label' onclick='return false;' aria-label='Next'><span aria-hidden='true'>NEXT</span></a></li>";
					
					// If currently active page is last page in current dataset but not the last page in all the records, replace the default carousel right arrow with a replica, so that next dataset can be loaded
					if (activePageNum == numOfPages)
					{
						$("#invoiceCView .slick-next").hide();
						
						var dummyNextButton = '<button type="button" id="dummy-invoice-next" data-role="none" class="dummy-next slick-next slick-arrow" aria-label="Next" role="button" aria-disabled="false">Next</button>';
						$(".ccp-invoice-regular").append(dummyNextButton);
					}
					// Show the default carousel arrows when currently active page is not the last page in current dataset or in all the records 
					else
					{
						$("#invoiceCView .slick-next").show();
						$("#invoiceCView .slick-next").prop("disabled", false);
					}
				}
            }
			// pages in the middle
			else
			{
				// Create the page number links for the page numbers that will be shown in the pagination 
				if ( numOfPagesFull <= 5
					|| (activePageNumFull == 1 && i <= 3)
					|| (activePageNumFull == 4 && i == 2)
					|| ((activePageNumFull == numOfPagesFull - 3) && (numOfPagesFull - i == 1))
					|| (activePageNumFull == numOfPagesFull && (numOfPagesFull - i <= 2))
					|| ((i == activePageNumFull) || (i == activePageNumFull - 1) || (i == activePageNumFull + 1)))
				{
					if (i == activePageNumFull)
					{
						pageStr += "<li><a class='ccp-page-no ccp-page-active'>" + i + "</a></li>";
					}
					else
					{
						pageStr += "<li><a class='invoice-page ccp-page-no' id='invoice-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
					}
				}
				// Creatge elipsis icon for the page number that won't be displayed in the pagination, one before the active page and one after the active page
				else
				{
					if (i < activePageNumFull && !beforeFlag)
					{
						pageStr += "<li>...</li>";
						beforeFlag = true;
					}
					else if (i > activePageNumFull && !afterFlag)
					{
						pageStr += "<li>...</li>";
						afterFlag = true;
					}
				}
			}
        }
		
        $("#invoicePages").html(pageStr);
        
		// Click event of Page Number links
		$("#invoicePages a.invoice-page.ccp-page-no").on("click", function(){
            var pageEvent = component.getEvent("pageEvent");
			var pageNum = $(this).data("page");
            pageEvent.setParams({"type": "page", "pageNum": pageNum}).fire();
        });
		
		// Click event of Previous link
		$("#invoice-prev").on("click", function(){
            var pageEvent = component.getEvent("pageEvent");
            pageEvent.setParams({"type": "previous"}).fire();
        });
		
		// Click event of Dummy Carousel left arrow when the active page is first page in the current dataset but not overall first page.
		$("#dummy-invoice-prev").on("click", function(){
			var pageEvent = component.getEvent("pageEvent");
            pageEvent.setParams({"type": "previous"}).fire();
        });
		
		// Click event of Next link
		$("#invoice-next").on("click", function(){
            var pageEvent = component.getEvent("pageEvent");
            pageEvent.setParams({"type": "next"}).fire();
        });
		
		// Click event of Dummy Carousel right arrow when the active page is last page in the current dataset but not overall last page.
		$("#dummy-invoice-next").on("click", function(){
			var pageEvent = component.getEvent("pageEvent");
            pageEvent.setParams({"type": "next"}).fire();
        });
		
		component.set("v.comingFromNavFlag", false);
		component.set("v.comingFromResizeFlag", false);
    },
	
	// Navigate to a particular slide in carousel
	navToCurrentSlide : function(component){
		component.set("v.comingFromNavFlag", true);
		
		var resizeFlag = component.get("v.comingFromResizeFlag");
		// In case coming from resize flag, reload the carousel to overcome the carousel bug of showing multiple rows.
		if (resizeFlag)
		{
			var slickObj = $('#invoiceCView').slick("getSlick");
			var slidesPerPage = slickObj.options.slidesToShow;
			var slideCount = slickObj.slideCount;
			
			if (slideCount <= slidesPerPage)
			{
				this.reloadCarousel(component, true);
				return;
			}
		}
		
		// Set the active slide number and move to that slide in the carousel
		var activeSlideNum = component.get("v.activeSlideNum");
		$("#invoiceCView").slick("slickGoTo", activeSlideNum, false);
		$("#invoiceCView").slick("setOption", "speed", 300, false );
	},
	
	// Navigate to a particular page in carousel
	navToCardPage : function(component, eType, pageNum){
		// Offset value of current dataset
		var currentOffset = component.get("v.currentOffset");
		// Size of each dataset
		var chunkSize = component.get("v.chunkSize");
		var slickObj = $('#invoiceCView').slick("getSlick");
		// Number of slide per carousel page
		var slidesPerPage = slickObj.options.slidesToShow;
		// Number of carousel slides in current dataset
		var slideCount = slickObj.slideCount;
		// Number of carousel slides in all the records
        var slideCountFull = component.get("v.totalRecords");
		// Number of carousel pages in current dataset
        var numOfPages = Math.ceil(chunkSize / slidesPerPage);
		// Number of carousel pages in all the records 
        var numOfPagesFull = Math.ceil(slideCountFull / slidesPerPage);
		// Lowest possible page number for the current dataset
		var currentMinPageFull = Math.ceil((currentOffset + 1) / slidesPerPage);
		// Highest possible page number for the current dataset
		var currentMaxPageFull = Math.ceil((currentOffset + chunkSize) / slidesPerPage);
		
		var newPageNum, newSlideNum;
		
		// Determine the page number to navigate to
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
		
		// Return in case of invalid page number
		if (newPageNum < 1 || newPageNum > numOfPagesFull)
		{
			return;
		}
		
		// When the data for the target dataset is not available in the carousel, determine the offset and fetch the data from server
		if (newPageNum < currentMinPageFull || newPageNum > currentMaxPageFull)
		{
			var diff, firstPageInRange;
			// Determine the first page of the target dataset
			if (slidesPerPage == 1)
			{
				diff = newPageNum % chunkSize;
				
				if (diff == 0)
				{
					firstPageInRange = newPageNum - chunkSize + 1;
				}
				else
				{
					firstPageInRange = newPageNum - diff + 1;
				}
			}
			else
			{
				diff = newPageNum % numOfPages;
				
				if (diff == 0)
				{
					firstPageInRange = newPageNum - numOfPages + 1;
				}
				else
				{
					firstPageInRange = newPageNum - diff + 1;
				}
			}
			
			component.set("v.serverPageFlag", true);
			component.set("v.serverPageNum", newPageNum);
			
			// Calculate offset for the first page in the target dataset
			var offset = (firstPageInRange - 1) * slidesPerPage;
			
			// Fetch the data for the target dataset
			this.repeatInvoiceFetch(component, offset);
			return;
		}
		
		// If the target page is not part of the first dataset, find out the page number for the target page in the current dataset
		if (!(newPageNum >= 1 && newPageNum <= numOfPages))
		{
			if (slidesPerPage == 1)
			{
				newPageNum = newPageNum % chunkSize;
				
				if (newPageNum == 0)
				{
					newPageNum = chunkSize;
				}
			}
			else
			{
				newPageNum = newPageNum % numOfPages;
				
				if (newPageNum == 0)
				{
					newPageNum = numOfPages;
				}
			}
		}
		
		// Calculate the slide number of the first slide on the target page
		newSlideNum = (newPageNum - 1) * slidesPerPage;
		
		component.set("v.activeSlideNum", newSlideNum);
		
		// Move carousel to the target slide
		this.navToCurrentSlide(component);
    },
	
	// On click of an Invoice card, load the corresponding order details
	handleCardClick : function(component, GON, inv, fset){
		component.set("v.activeINV", inv);
		
		var activeGON = component.get("v.activeGON");
		var activeFSET = component.get("v.activeFSET");
		if (activeGON != GON || activeFSET != fset)
		{
			component.set("v.activeGON", GON);
			component.set("v.activeFSET", fset);
			
			$("#orderErrorSection").text("").hide();
			$("#orderDetailsSection, #orderLoadInfo").show();
			$("#orderDetailsDiv").hide();
			
			var action = component.get("c.fetchOrderDetails");
			action.setParams({
				"GON": GON,
				"FSetNumber": '' + fset
			});
			action.setCallback(this, function(response) {
				var state = response.getState();
				if (component.isValid() && state === "SUCCESS") {
					if (inv != component.get("v.activeINV"))
					{
						// Do nothing as this is not the latest order detail request
						console.log("Not the latest order detail request! Returning Empty-handed!");
						return;
					}
					
					var orderDet = response.getReturnValue();
					if (orderDet.hasOwnProperty("GON"))
					{
						component.set("v.orderDetails", orderDet);
						$("#orderLoadInfo").hide();
						$("#orderDetailsDiv").show();
					}
					else
					{
						this.showError(component, "order", "invalid");
					}
				}
				else if (state === "ERROR"){
					this.showError(component, "order", "exception");
				}
			});
			$A.enqueueAction(action);
		}
	},
	
	// Reload the carousel
	reloadCarousel : function(component, repopulate){
		// Remove the carousel completely from the DOM
		$("#invoiceCView").slick("unslick");
		$("#invoiceCView").remove();
		// Repopulate carousel if required
		if (repopulate)
		{
			this.populateInvoices(component);
		}
	},
	
	// Highlight/zoom in the target slide
	highlightCard : function(component, slideNum){
		$("#invoice-slide-" + slideNum).addClass("ccp-invoice-active-card");
	},
	
	// De-highlight/zoom out the already highlighted cards
	unhighlightCards : function(component){
		$("#invoiceCView .ccp-invoice-active-card").removeClass("ccp-invoice-active-card");
    }
})