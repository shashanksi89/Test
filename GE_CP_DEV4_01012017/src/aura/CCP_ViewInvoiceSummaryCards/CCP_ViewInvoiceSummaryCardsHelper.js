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
	
	showError : function(component) {
		var errMsg = "An error occurred while loading invoices.<br />";
		errMsg += "Kindly visit Contact Us page and provide necessary information.";
		
		var scriptFlag = component.get("v.scriptFlag");
		if (scriptFlag)
		{
			// Hide load spinner
			$("#invoiceLoadInfo").hide();
			
			// Show the error message
			$("#invoiceErrorSection").html(errMsg).show();
		}
		else
		{
			document.getElementById("invoiceLoadInfo").style.display = "none";
			document.getElementById("invoiceErrorSection").innerHTML = errMsg;
			document.getElementById("invoiceErrorSection").style.display = "block";
		}
	},
	
	createDatesArray : function(component){
        var action = component.get("c.createDatesArray");	
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                component.set("v.datesObj", response.getReturnValue());
            }
			else if (state === "ERROR"){
                this.showError(component);
            }
        });
        $A.enqueueAction(action);
    },
	
	fetchInvoicesJSON : function(component, GON) {
		var activeGON = component.get("v.activeGON");
        if(activeGON != GON){
			component.set("v.activeGON", GON);
			component.set("v.dataFlag", false);
			
			var action = component.get("c.fetchInvoicesJSON");
			action.setParams({
				"GON":GON
			});
			action.setCallback(this, function(response) {
				var state = response.getState();
				if (component.isValid() && state === "SUCCESS") {
					var retVal = response.getReturnValue();
					var returnedGON = retVal["GON"];
					if (returnedGON != component.get("v.activeGON"))
					{
						// Do nothing as this is not the latest invoice request
						console.log("Not the latest invoice request! Returning Empty-handed!")
						return;
					}
					
					component.set("v.invoiceWrappersJSON", retVal["invoices"]);
					component.set("v.dataFlag", true);
					component.set("v.activeSlideNum", -1);
					this.initDisplay(component);
				}
				else if (state === "ERROR"){
					this.showError(component);
				}
			});
			$A.enqueueAction(action);
			
			// Show invoices section heading here
			var urlGON = component.get("v.urlGON");
			var invHeading = "ALL INVOICES";
			if (urlGON == "undefined")
			{
				invHeading = "My Invoices for Order Number: " + GON;
			}
			
			component.set("v.searchInput", "");
			
			var scriptFlag = component.get("v.scriptFlag");
			if (scriptFlag)
			{
				// Show load animation
				$("#invoiceLoadInfo").show();
				// Remove the old data and destroy the carousel
				this.reloadCarousel(component, false);
				// Disable search/sort/filter and hide the pagination
				$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", true);
				$("#invoiceSort").selectpicker('refresh');
				$("#invoicePageSection").hide();
				// Clear search box
				$( "#invoiceSearchText" ).val("");
				
				// Hide any error messages
				$("#invoiceErrorSection").text("").hide();
				
				// Reset sort type here to default sort type
				component.set("v.invoiceSortType", "invoiceDateDesc");
				$( "#invoiceSort" ).val("invoiceDateDesc");
				
				// Clear Filters Fields, Pills and Filter Object Here
				$("#invoice-Last-30-Days, #invoice-Last-60-Days, #invoice-Date-Range, #invoice-Open, #invoice-Closed").prop("checked", false);
				$("#invoiceFromDate, #invoiceToDate").prop('disabled', true).val("");
				var filterObj = {isFilter : false};
				component.set("v.invoiceFilterObj", filterObj);
				this.showHideFilterPills(component);
				
				$("#invoiceHeading").text(invHeading).show();
			}
			else
			{
				document.getElementById("invoiceLoadInfo").style.display = "block";
				document.getElementById("invoicePageSection").style.display = "none";
				document.getElementById("invoiceErrorSection").style.display = "none";
				document.getElementById("invoicePillsSection").style.display = "none";
				document.getElementById("invoiceHeading").innerHTML = invHeading;
				document.getElementById("invoiceHeading").style.display = "block";
				document.getElementById("invoiceSearchText").value = "";
			}
        }
    },
	
    initDisplay : function(component) {
        var dataFlag = component.get("v.dataFlag");
        var scriptFlag = component.get("v.scriptFlag");
        if (dataFlag && scriptFlag)
        {
			var invoicesArr = JSON.parse(component.get("v.invoiceWrappersJSON"));
            component.set("v.arrInvoicesObj", invoicesArr);
			
			// For Order Details page, share fetched invoices with Order Details component
			var urlGON = component.get("v.urlGON");
			if (urlGON != "undefined")
			{
				var shareInvoices = $A.get("e.c:CCP_shareInvoices");
				shareInvoices.setParams({ "invoices": invoicesArr }).fire();
			}
            
			// Hide load animation
			$("#invoiceLoadInfo").hide();
			
			if (!invoicesArr || invoicesArr.length == 0)
            {
				$("#invoiceErrorSection").html("There are no invoices for this order.").show();
            }
            else
            {
				$("#invoicePageSection").show();
				this.sortInvoices(component);
				this.populateInvoices(component);
				
				$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", false);
				$("#invoiceSort").selectpicker('refresh');
            }
        }
    },
	
	searchInvoices : function(component) {
        // Get the order number and search input
		var GON = component.get("v.activeGON");
		var inputSearch = component.get("v.searchInput");
		var action = component.get("c.searchInvoices");
        action.setParams({
            "GON": GON, 
			"inputSearch": inputSearch
        });
        action.setCallback(this, function(response) {
        	var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                var strResponse = response.getReturnValue();
				component.set("v.invoiceWrappersJSON", strResponse);
				var invoicesArr = JSON.parse(strResponse);
				component.set("v.arrInvoicesObj", invoicesArr);
                
				if (invoicesArr.length > 0)
				{
					this.filterInvoices(component);
					invoicesArr = component.get("v.arrInvoicesObj");
					
					if (invoicesArr.length > 0)
					{
						$("#invoicePageSection").show();
						this.sortInvoices(component);
						this.populateInvoices(component);
					}
					else
					{
						$("#invoiceErrorSection").text("Your search did not yield any matching invoices.").show();
						component.set("v.activeSlideNum", -1);
					}
				}
				else
				{
					$("#invoiceErrorSection").text("Your search did not yield any matching invoices.").show();
					component.set("v.activeSlideNum", -1);
				}
				
				// Hide load spinner
				$("#invoiceLoadInfo").hide();
				// Enable search/sort/filter
				$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", false);
				$("#invoiceSort").selectpicker('refresh');
				// Show the applicable filter pills
				this.showHideFilterPills(component);
            }
			else if (state === "ERROR"){
                this.showError(component);
            }
		});
        $A.enqueueAction(action);
		
		// Show load animation
		$("#invoiceLoadInfo").show();
		// Remove the old data and destroy the carousel
		this.reloadCarousel(component, false);
		// Disable search/sort/filter and hide the pagination
		$("#invoiceSearchText, #invoiceSearchButton, #invoiceSort, #invoice-filter-button").prop("disabled", true);
		$("#invoiceSort").selectpicker('refresh');
		$("#invoicePageSection").hide();
		// Hide any error messages
		$("#invoiceErrorSection").text("").hide();
		// Hide filter pills
		$("#invoicePillsSection").hide();
	},
	
	checkFilters: function(component){
	    var filterObj = {};
		filterObj.isFilter = false;
		
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
				
				if (toDate < fromDate)
				{
					alert("Error: To date cannot be earlier than From date.");
					return false;
				}
				
				filterObj.fromDate = fromDate;
				filterObj.fromDateDisplay = $("#invoiceFromDate").val();
				filterObj.toDate = toDate;
				filterObj.toDateDisplay = $("#invoiceToDate").val();
				filterObj.dateRange = true;
				filterObj.isFilter = true;
			}
		}
		
		if ($("#invoice-Last-30-Days").prop("checked"))
		{
			filterObj.last30Days = true;
			filterObj.isFilter = true;
		}
		
		if ($("#invoice-Last-60-Days").prop("checked"))
		{
			filterObj.last60Days = true;
			filterObj.isFilter = true;
		}
		
		if ($("#invoice-Open").prop("checked"))
		{
			filterObj.invoiceOpen = true;
			filterObj.statusFilter = true;
			filterObj.isFilter = true;
		}
		
		if ($("#invoice-Closed").prop("checked"))
		{
			filterObj.invoiceClosed = true;
			filterObj.statusFilter = true;
			filterObj.isFilter = true;
		}
		
		component.set("v.invoiceFilterObj", filterObj);
		return true;
	},
	
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
		
		if (filterObj.isFilter)
		{
			$("#invoicePillClearAll, #invoicePillsSection").show();
		}
		else
		{
			$("#invoicePillClearAll, #invoicePillsSection").hide();
		}
	},
	
	filterInvoices: function(component){
		var filterObj = component.get("v.invoiceFilterObj");
		var invoicesArr = JSON.parse(component.get("v.invoiceWrappersJSON"));
		
		if (filterObj.isFilter)
		{
			invoicesArr = $.grep(invoicesArr, function (element, index) {
				
				var dateFlag = true;
				var statusFlag = false;
				
				if (filterObj.last30Days || filterObj.last60Days)
				{
					var datesObj = component.get("v.datesObj");
					
					if (filterObj.last30Days)
					{
						if (!(element.InvoiceDate_ISO >= datesObj.Last30Days && element.InvoiceDate_ISO <= datesObj.Today))
						{
							dateFlag = false;
						}
					}
					
					if (filterObj.last60Days)
					{
						if (!(element.InvoiceDate_ISO >= datesObj.Last60Days && element.InvoiceDate_ISO <= datesObj.Today))
						{
							dateFlag = false;
						}
					}
				}
				
				if (filterObj.dateRange)
				{
					if (!(element.InvoiceDate_ISO >= filterObj.fromDate && element.InvoiceDate_ISO <= filterObj.toDate))
					{
						dateFlag = false;
					}
				}
				
				if (filterObj.statusFilter)
				{
					if ((filterObj.invoiceOpen && element.InvoiceStatus == "Open")
						|| (filterObj.invoiceClosed && element.InvoiceStatus == "Closed"))
					{
						statusFlag = true;
					}
				}
				else
				{
					statusFlag = true;
				}
				
				return dateFlag && statusFlag;
			});
		}
		component.set("v.arrInvoicesObj", invoicesArr);
	},
	
	sortInvoices : function(component){
		var sortType = component.get("v.invoiceSortType");
        
		if (sortType != "")
		{
			var invoicesArr = component.get("v.arrInvoicesObj");
			
			invoicesArr.sort(function(a, b){
				if (sortType == "invoiceValAsc")
				{
					var valA = a.InvoiceAmount;
					var valB = b.InvoiceAmount;
					if (valA < valB) //sort ascending
						return -1;
					if (valA > valB)
						return 1;
					return 0; //default return value (no sorting)
				}
				else if (sortType == "invoiceValDesc")
				{
					var valA = a.InvoiceAmount;
					var valB = b.InvoiceAmount;
					if (valA > valB) //sort descending
						return -1;
					if (valA < valB)
						return 1;
					return 0; //default return value (no sorting)
				}
				else if (sortType == "invoiceDateAsc")
				{
					var dateA = a.InvoiceDate_ISO;
					var dateB = b.InvoiceDate_ISO;
					if (dateA < dateB) //sort ascending
						return -1;
					if (dateA > dateB)
						return 1;
					return 0; //default return value (no sorting)
				}
				else if (sortType == "invoiceDateDesc")
				{
					var dateA = a.InvoiceDate_ISO;
					var dateB = b.InvoiceDate_ISO;
					if (dateA > dateB) //sort descending
						return -1;
					if (dateA < dateB)
						return 1;
					return 0; //default return value (no sorting)
				}
				else if (sortType == "invoiceStatusAsc")
				{
					var valA = a.InvoiceStatus;
					var valB = b.InvoiceStatus;
					if (valA < valB) //sort ascending
						return -1;
					if (valA > valB)
						return 1;
					return 0; //default return value (no sorting)
				}
				else if (sortType == "invoiceStatusDesc")
				{
					var valA = a.InvoiceStatus;
					var valB = b.InvoiceStatus;
					if (valA > valB) //sort descending
						return -1;
					if (valA < valB)
						return 1;
					return 0; //default return value (no sorting)
				}
			});
			
			component.set("v.arrInvoicesObj", invoicesArr);
		}
    },
	
	populateInvoices : function(component) {
		var invoicesArr = component.get("v.arrInvoicesObj");
        
		if (invoicesArr.length > 0)
		{
			var urlGON = component.get("v.urlGON");
			var titleInvDate = "Date invoice was generated by GE";
			var titlePONum = "Reference number of the Purchase Order placed by you";
			if (urlGON == "undefined")
			{
				titleInvDate = "The date when the invoice was generated by GE";
				titlePONum = "Reference number from your Purchase Order document";
			}
			
			$("#invoiceCarouselSection").html('<div id="invoiceCView" class="ccp-order-invoice-regular"></div>');
			$.each(invoicesArr, function( index, value ) {
				var currCard = '<div class="ccp-order-invoice-card" id="invoice-slide-' + index + '" data-slide-num="' + index + '" >';
				
				currCard += '<div class="col-xs-12">';
				currCard += '<p class="col-xs-6 ccp-invoice-border"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="Reference number of invoice">Invoice Number</span><br/>';
				currCard += '<span class="ccp-invoice-num ccp-ellipsis" title="' + value.InvoiceNumber + '">' + value.InvoiceNumber + '</span></span></p>';
				currCard += '<p class="col-xs-6"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="' + titleInvDate + '">Invoice Date</span><br/>';
				currCard += '<span class="ccp-card-label2">' + value.InvoiceDate + '</span></span></p>';
				currCard += '</div>';
				
				currCard += '<div class="col-xs-12 invoice-8-card-view">';
				currCard += '<p class="col-xs-6 ccp-invoice-border"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="' + titlePONum + '">PO Number</span><br/>';
				currCard += '<span class="ccp-card-label2 ccp-ellipsis" title="' + value.PONumber + '">' + value.PONumber + '</span></span></p>';
				currCard += '<p class="col-xs-6"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="GE internal reference number of the order generated for your Purchase Order">Order Number</span><br/>';
				currCard += '<span class="ccp-card-label2 ccp-ellipsis" title="' + value.GON + '">' + value.GON + '</span></span></p>';
				currCard += '</div>';
				
				currCard += '<div class="col-xs-12">';
				currCard += '<p class="col-xs-6 ccp-invoice-border"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="Amount billed on a specific invoice">Invoice Amount</span><br/>';
				currCard += '<span class="ccp-card-price">' + CCP_formatAmount(value.InvoiceAmount, value.currencyCode) + '</span></span></p>';
				currCard += '<p class="col-xs-6"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="Invoice amount pending payment">Invoice Due Amount</span><br/>';
				currCard += '<span class="ccp-card-price">' + CCP_formatAmount(value.InvoiceDueAmount, value.currencyCode) + '</span></span></p>';
				currCard += '</div>';
				
				currCard += '<div class="col-xs-12 ccp-border-none">';
				currCard += '<p class="col-xs-6 ccp-invoice-border"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="Date by which payment is contractually expected">Payment Due Date</span><br/>';
				currCard += '<span class="ccp-card-label2">' + value.PaymentDueDate + '</span></span></p>';
				currCard += '<p class="col-xs-6"><span class="ccp-ver-align">';
				currCard += '<span class="ccp-card-label1" title="Indicates if entire invoice amount has been paid">Invoice Status</span><br/>';
				currCard += '<span class="ccp-card-label2 ccp-upper-text">' + value.InvoiceStatus + '</span></span></p>';
				currCard += '</div>';
				
				currCard += '<div class="col-xs-12 ccp-invoice-bottom-pad"><div class="ccp-invoice-bottom"> </div></div>';
				
				currCard += '</div>';
				
				$("#invoiceCView").append(currCard);
			});
			
			$("#invoiceCView").slick({
				adaptiveHeight:false,
				infinite: false,
				slidesToShow: 4,
				slidesToScroll: 4,
				draggable: false,
				responsive: [
					{
						breakpoint: 1281,
						settings: {
							slidesToShow: 3,
							slidesToScroll: 3
						}
					},
					{
						breakpoint: 994,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 2
						}
					},
					{
						breakpoint: 581,
						settings: {
							slidesToShow: 1,
							slidesToScroll: 1,
						}
					}
				]
			});
			
			$("#invoiceCView .ccp-order-invoice-card").click(function(){
				var activeSlideNum = component.get("v.activeSlideNum");
				var newSlideNum = parseInt($(this).data("slideNum"), 10);
				
				if (activeSlideNum != newSlideNum)
				{
					var pageEvent = component.getEvent("pageEvent");
					pageEvent.setParams({"type": "unhighlight"}).fire();
					
					var pageEvent = component.getEvent("pageEvent");
					pageEvent.setParams({"type": "highlight", "pageNum": newSlideNum}).fire();
					
					component.set("v.activeSlideNum", newSlideNum);
				}
			});
			
			// On before slide change
			$('#invoiceCView').on('beforeChange', function(event, slick, currentSlide, nextSlide){
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "unhighlight"}).fire();
			});
			
			$('#invoiceCView').on('setPosition', function(event, slick){
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
				
				var newSlideNum = component.get("v.activeSlideNum");
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "highlight", "pageNum": newSlideNum}).fire();
			});
			
			// On edge hit
			$('#invoiceCView').on('edge', function(event, slick, direction){
				var slickObj = $('#invoiceCView').slick("getSlick");
				var slideCount = slickObj.slideCount;
				var slidesPerPage = slickObj.options.slidesToShow;
				var numOfPages = Math.ceil(slideCount / slidesPerPage);
				
				var activeSlideNum = component.get("v.activeSlideNum");
				var activePageNum = Math.ceil((activeSlideNum + 1) / slidesPerPage);
				
				
				if (direction == "right")
				{
					if (activePageNum == 1)
					{
						component.set("v.edgeSwipeFlag", true);
					}
				}
				else if (direction == "left")
				{
					if (activePageNum == numOfPages || numOfPages == component.get("v.activePageNum"))
					{
						component.set("v.edgeSwipeFlag", true);
					}
				}
			});
			
			$('#invoiceCView').on('afterChange', function(event, slick, currentSlide){
				var navFlag = component.get("v.comingFromNavFlag");
				var resizeFlag = component.get("v.comingFromResizeFlag");
				var activeSlideNum = component.get("v.activeSlideNum");
				var swipeFlag = component.get("v.edgeSwipeFlag");
				
				if (!navFlag && !resizeFlag && !swipeFlag)
				{
					activeSlideNum = currentSlide;
					component.set("v.activeSlideNum", currentSlide);
				}
				
				var pageEvent = component.getEvent("pageEvent");
				pageEvent.setParams({"type": "rebuildPagination"}).fire();
			});
			
			var activeSlideNum = 0;
			var swipeFlag = component.get("v.edgeSwipeFlag");
			if (swipeFlag)
			{
				component.set("v.edgeSwipeFlag", false);
				activeSlideNum = component.get("v.activeSlideNum");
				$("#invoiceCView").slick("setOption", "speed", 1, false );
			}
			
			var slidesPerPage = $('#invoiceCView').slick("slickGetOption", 'slidesToShow');
			if (invoicesArr.length <= slidesPerPage)
			{
				var resizeFlag = component.get("v.comingFromResizeFlag");
				if (resizeFlag)
				{
					activeSlideNum = component.get("v.activeSlideNum");
				}
				component.set("v.activeSlideNum", activeSlideNum);
				
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
		var slickObj = $('#invoiceCView').slick("getSlick");
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
				$("#invoice-slide-" + x).removeClass("ccp-z-index-1 ccp-z-index-2 ccp-z-index-3 ccp-z-index-4 ccp-z-index-5 ccp-z-index-6 ccp-z-index-7 ccp-z-index-8 ccp-z-index-9 ccp-z-index-10");
				$("#invoice-slide-" + x).addClass("ccp-z-index-" + z);
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
					$("#invoiceCView .slick-prev").prop("disabled", true);
				}
				else
				{
					pageStr += "<li><a id='invoice-prev' class='ccp-page-no ccp-label' onclick='return false;' aria-label='Previous'><span aria-hidden='true'>PREVIOUS</span></a></li>";
					$("#invoiceCView .slick-prev").prop("disabled", false);
				}
				
				if (i == activePageNum)
				{
					pageStr += "<li><a class='ccp-page-no ccp-page-active'>" + i + "</a></li>";
				}
				else
				{
					pageStr += "<li><a class='invoice-page ccp-page-no' id='invoice-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
				}
				
				if (numOfPages == 1)
				{
					pageStr += "<li><a class='ccp-page-disable'>NEXT</a></li>";
					$("#invoiceCView .slick-next").prop("disabled", true);
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
					pageStr += "<li><a class='invoice-page ccp-page-no' id='invoice-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
				}
				
				if (activePageNum == numOfPages)
				{
					pageStr += "<li><a class='ccp-page-disable'>NEXT</a></li>";
					$("#invoiceCView .slick-next").prop("disabled", true);
				}
				else
				{
					pageStr += " <li><a id='invoice-next' class='ccp-page-no ccp-label' onclick='return false;' aria-label='Next'><span aria-hidden='true'>NEXT</span></a></li>";
					$("#invoiceCView .slick-next").prop("disabled", false);
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
						pageStr += "<li><a class='invoice-page ccp-page-no' id='invoice-page-" + i + "' data-page='" + i + "'>" + i + "</a></li>";
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
		
        $("#invoicePages").html(pageStr);
        
		$("#invoicePages a.invoice-page.ccp-page-no").on("click", function(){
            var pageEvent = component.getEvent("pageEvent");
			var pageNum = $(this).data("page");
            pageEvent.setParams({"type": "page", "pageNum": pageNum}).fire();
        });
		
		$("#invoice-prev").on("click", function(){
            var pageEvent = component.getEvent("pageEvent");
            pageEvent.setParams({"type": "previous"}).fire();
        });
		
		$("#invoice-next").on("click", function(){
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
			var slickObj = $('#invoiceCView').slick("getSlick");
			var slidesPerPage = slickObj.options.slidesToShow;
			var slideCount = slickObj.slideCount;
			
			if (slideCount <= slidesPerPage)
			{
				this.reloadCarousel(component, true);
				return;
			}
		}
		
		var activeSlideNum = component.get("v.activeSlideNum");
		
		$("#invoiceCView").slick("slickGoTo", activeSlideNum, false);
		$("#invoiceCView").slick("setOption", "speed", 300, false );
	},
	
	navToCardPage : function(component, eType, pageNum){
		var slickObj = $('#invoiceCView').slick("getSlick");
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
	
	reloadCarousel : function(component, repopulate){
		$("#invoiceCView").slick("unslick");
		$("#invoiceCView").remove();
		if (repopulate)
		{
			this.populateInvoices(component);
		}
	},
	
	highlightCard : function(component, slideNum){
		$("#invoice-slide-" + slideNum).addClass("ccp-order-invoice-active-card");
	},
	
	unhighlightCards : function(component){
		$("#invoiceCView .ccp-order-invoice-active-card").removeClass("ccp-order-invoice-active-card");
    }
})