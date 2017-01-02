public without sharing class CCP_OrderDataController {
    
    @AuraEnabled 
    public static string fetchMyOrdersJSON(string inputSearch, string sortType, string sortOrder, string fromDate_ISO, string toDate_ISO, string orderStatusFilter, string defaultDateFlag){
        try{
            system.debug(string.valueOf(defaultDateFlag));
            date fromDate;
            date toDate;
            if(string.isEmpty(fromDate_ISO)){
                fromDate = null;
                if(string.valueOf(defaultDateFlag) == 'true'){
                	fromDate = system.today().addMonths(-6).addDays(1);
                }
            }else{
                fromDate = date.valueOf(fromDate_ISO);
            }
            if(string.isEmpty(toDate_ISO)){
                toDate = null;
                if(string.valueOf(defaultDateFlag) == 'true'){
                    toDate = system.today();
                }
            }else{
                toDate = date.valueOf(toDate_ISO);
            }
            List<CCP_OrderDataWrapper> listOrders = CCP_DatabaseUtility.fetchMyOrders(inputSearch, sortType, sortOrder, fromDate, toDate, orderStatusFilter);
            string result = '';
            if(!string.isEmpty(inputSearch) && listOrders != null && listOrders.size() > 500){
                result = 'Too many results';
            }else{
                result = JSON.serialize(listOrders);
            }
            return result;
    	}catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_OrderDataController.fetchMyOrdersJSON', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
    }
    
    @AuraEnabled
    public static CCP_OrderDataWrapper fetchOrderDetails(string GON){
        try{
            if(string.isEmpty(GON)){
                throw new CCP_DatabaseUtility.applicationException('GON Cannot be null');
            }
            
            List<CCP_OrderDataWrapper> listOrders = CCP_DatabaseUtility.fetchOrderDetails(GON);
        
            if (listOrders.size() > 0)
            {
                return listOrders[0];
            }
            else
            {
                return new CCP_OrderDataWrapper();
            }
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_OrderDataController.fetchOrderDetails', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
    }
    
    @AuraEnabled
    public static map<String, String> createDatesArray(){
        try{
            String todayDisplay = system.now().format('d MMM yyyy');
            Date last6Months = system.today().addMonths(-6).addDays(1);
            Datetime dt = datetime.newInstance(last6Months.year(), last6Months.month(), last6Months.day());
            String last6MonthsDisplay = dt.format('d MMM yyyy');
            
            return new map<String, String>{
                'Today' => String.valueOf(system.today()),
                'TodayDisplay' => todayDisplay,
                'Last30Days' => String.valueOf(system.today().addDays(-29)),
                'Last60Days' => String.valueOf(system.today().addDays(-59)),
                'Last6Months' => String.valueOf(last6Months),
                'Last6MonthsDisplay' => last6MonthsDisplay
            };
        }catch(exception ex){
            CCP_DatabaseUtility.createErrorRecord('CCP_OrderDataController.createDatesArray', ex.getMessage(), userInfo.getUserId());
            throw new CCP_DatabaseUtility.applicationException(ex.getMessage());
            return null;
        }
    }
}