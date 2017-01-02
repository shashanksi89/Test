@isTest(SeeAllData=true)
private class CCP_OrderDataControllerTest {

    static testMethod void testcreateDatesArray(){
        map<string, string> dateArray = CCP_OrderDataController.createDatesArray();
    }    
    
    static testMethod void testFetchMyOrders(){
        Account testAccount = TestDataBuilder.buildTestAccount(1, UserInfo.getUserId());
        testAccount.UCM_ID__c = '1-ABC';
        insert testAccount;
        Contact testContact1 = TestDataBuilder.buildTestContact(1, testAccount);
        insert testContact1;
        Profile p = [SELECT Id FROM Profile WHERE Name='GEHC Customer Community User' limit 1];
        User u = new User();
        u.alias = 'test123'; 
        u.email='test123@noemail.com';
        u.emailencodingkey='UTF-8';
        u.lastname='Testing';
        u.languagelocalekey='en_US';
        u.localesidkey='en_US'; 
        u.profileid = p.Id;
        u.country='United States';
        u.timezonesidkey='America/Los_Angeles';
        u.username='test123@noemail.com';
        u.ContactId=testContact1.Id;
        insert u;
        List<Order_Header__c> ohList = new List<Order_Header__c>();
        Order_Header__c orderHeader = new Order_Header__c ();      
        orderHeader.PO_Number__c = '90091';
        orderHeader.CurrencyISOCode = 'USD';
        orderHeader.Order_Number__c =  '110011';        
        orderHeader.Customer_Name__c = 'RAPIDES REGIONAL MEDICAL CENTER';     
        orderHeader.Order_Date__c = system.today();
        orderHeader.Order_Status__c = 'Closed';
        orderHeader.Total_Order_Value__c = 0.0;
        orderHeader.StatusSortCode__c = 2.0;
        orderHeader.Order_Source__c = 'eOM';
        orderHeader.BT_Account_UCM_Ids__c = '1-ABC';
        orderHeader.ST_Account_UCM_Ids__c = '1-ABC';
        ohList.add(orderHeader);
        Order_Header__c orderHeader1 = new Order_Header__c ();      
        orderHeader1.PO_Number__c = '90091';
        orderHeader1.CurrencyISOCode = 'USD';
        orderHeader1.Order_Number__c =  '110012';        
        orderHeader1.Customer_Name__c = 'RAPIDES REGIONAL MEDICAL CENTER';     
        orderHeader1.Order_Date__c = system.today();
        orderHeader1.Order_Status__c = 'Open';
        orderHeader1.Total_Order_Value__c = 0.0;
        orderHeader1.StatusSortCode__c = 2.0;
        orderHeader1.Order_Source__c = 'eOM';
        orderHeader1.BT_Account_UCM_Ids__c = '1-ABC';
        orderHeader1.ST_Account_UCM_Ids__c = '1-ABC';
        ohList.add(orderHeader1);
        Order_Header__c orderHeader2 = new Order_Header__c ();      
        orderHeader2.PO_Number__c = '90091';
        orderHeader2.CurrencyISOCode = 'USD';
        orderHeader2.Order_Number__c =  '110013';        
        orderHeader2.Customer_Name__c = 'RAPIDES REGIONAL MEDICAL CENTER';     
        orderHeader2.Order_Date__c = system.today();
        orderHeader2.Order_Status__c = 'Cancelled';
        orderHeader2.Total_Order_Value__c = 0.0;
        orderHeader2.StatusSortCode__c = 2.0;
        orderHeader2.Order_Source__c = 'eOM';
        orderHeader2.BT_Account_UCM_Ids__c = '1-ABC';
        orderHeader2.ST_Account_UCM_Ids__c = '1-ABC';
        ohList.add(orderHeader2);
        insert ohList;
        system.runAs(u){
            string result = CCP_OrderDataController.fetchMyOrdersJSON('1100', '', '', '', '', '', 'true');
            result = CCP_OrderDataController.fetchMyOrdersJSON('1100', '', '', '', '', 'Closed', 'false');
            result = CCP_OrderDataController.fetchMyOrdersJSON('1100', '', '', string.valueOf(system.today()), string.valueOf(system.today().adddays(-2)), 'Closed', 'false');
            result = CCP_OrderDataController.fetchMyOrdersJSON('1100', 'OrderValue', 'ASC', string.valueOf(system.today()), string.valueOf(system.today().adddays(-2)), 'Closed', 'false');
            result = CCP_OrderDataController.fetchMyOrdersJSON('1100', 'OrderDate', 'ASC', string.valueOf(system.today()), string.valueOf(system.today().adddays(-2)), 'Closed', 'false');
            result = CCP_OrderDataController.fetchMyOrdersJSON('1100', 'CustName', 'ASC', string.valueOf(system.today()), string.valueOf(system.today().adddays(-2)), 'Closed', 'false');
            result = CCP_OrderDataController.fetchMyOrdersJSON('', 'OrderStatus', 'ASC', '','', '', 'false');
            result = CCP_OrderDataController.fetchMyOrdersJSON('', 'OrderStatus', 'DESC', '', '', '', 'false');
        }
    }
    
    static testMethod void testfetchOrderDetails(){
        Account testAccount = TestDataBuilder.buildTestAccount(1, UserInfo.getUserId());
        testAccount.UCM_ID__c = '1-ABC';
        insert testAccount;
        Contact testContact1 = TestDataBuilder.buildTestContact(1, testAccount);
        insert testContact1;
        Profile p = [SELECT Id FROM Profile WHERE Name='GEHC Customer Community User' limit 1];
        User u = new User();
        u.alias = 'test123'; 
        u.email='test123@noemail.com';
        u.emailencodingkey='UTF-8';
        u.lastname='Testing';
        u.languagelocalekey='en_US';
        u.localesidkey='en_US'; 
        u.profileid = p.Id;
        u.country='United States';
        u.timezonesidkey='America/Los_Angeles';
        u.username='test123@noemail.com';
        u.ContactId=testContact1.Id;
        insert u;
        Order_Header__c orderHeader = new Order_Header__c ();      
        orderHeader.PO_Number__c = '90091';
        orderHeader.CurrencyISOCode = 'USD';
        orderHeader.Order_Number__c =  '110011';        
        orderHeader.Customer_Name__c = 'RAPIDES REGIONAL MEDICAL CENTER';     
        orderHeader.Order_Date__c = system.today();
        orderHeader.Order_Status__c = 'Closed';
        orderHeader.Total_Order_Value__c = 0.0;
        orderHeader.StatusSortCode__c = 2.0;
        orderHeader.Order_Source__c = 'eOM';
        orderHeader.BT_Account_UCM_Ids__c = '1-ABC';
        orderHeader.ST_Account_UCM_Ids__c = '1-ABC';
        insert orderHeader;
        List<Shipment_Detail__c> shipList = new List<Shipment_Detail__c>();
        Shipment_Detail__c shipmentDetail = new Shipment_Detail__c();  
        shipmentDetail.Order_Header__c = orderHeader.Id;      
        shipmentDetail.Shipment_Set_Number__c = 1.0;
        shipmentDetail.CurrencyISOCode = 'USD';
        shipmentDetail.Description__c = 'IIS OTHER';
        shipmentDetail.Amount__c = 0.0;      
        shipmentDetail.Shipped_Date__c = system.today()-5;
        shipmentDetail.isShippingComplete__c = true;
        shipmentDetail.Delivered_Date__c = system.today()-5;
        shipmentDetail.isDeliveryComplete__c = true;
        shipmentDetail.Completed_Date__c = system.today();   
        shipList.add(shipmentDetail);
        Shipment_Detail__c shipmentDetail1 = new Shipment_Detail__c();  
        shipmentDetail1.Order_Header__c = orderHeader.Id;      
        shipmentDetail1.Shipment_Set_Number__c = 2.0;
        shipmentDetail1.CurrencyISOCode = 'USD';
        shipmentDetail1.Description__c = 'IIS OTHER';
        shipmentDetail1.Amount__c = 0.0;      
        shipmentDetail1.Shipped_Date__c = null;
        shipmentDetail1.isShippingComplete__c = true;
        shipmentDetail1.Delivered_Date__c = null;
        shipmentDetail1.isDeliveryComplete__c = true;
        shipmentDetail1.Completed_Date__c = null;   
        shipList.add(shipmentDetail1);
        Shipment_Detail__c shipmentDetail2 = new Shipment_Detail__c();  
        shipmentDetail2.Order_Header__c = orderHeader.Id;      
        shipmentDetail2.Shipment_Set_Number__c = 3.0;
        shipmentDetail2.CurrencyISOCode = 'USD';
        shipmentDetail2.Description__c = 'IIS OTHER';
        shipmentDetail2.Amount__c = 0.0;      
        shipmentDetail2.Shipped_Date__c = system.today().addYears(3);
        shipmentDetail2.isShippingComplete__c = false;
        shipmentDetail2.Delivered_Date__c = system.today().addYears(3);
        shipmentDetail2.isDeliveryComplete__c = false;
        shipmentDetail2.Completed_Date__c = null;   
        shipList.add(shipmentDetail2);
        Shipment_Detail__c shipmentDetail3 = new Shipment_Detail__c();  
        shipmentDetail3.Order_Header__c = orderHeader.Id;      
        shipmentDetail3.Shipment_Set_Number__c = 4.0;
        shipmentDetail3.CurrencyISOCode = 'USD';
        shipmentDetail3.Description__c = 'IIS OTHER';
        shipmentDetail3.Amount__c = 0.0;      
        shipmentDetail3.Shipped_Date__c = system.today().addDays(3);
        shipmentDetail3.isShippingComplete__c = false;
        shipmentDetail3.Delivered_Date__c = system.today().addDays(3);
        shipmentDetail3.isDeliveryComplete__c = false;
        shipmentDetail3.Completed_Date__c = null;   
        shipList.add(shipmentDetail3);
        Shipment_Detail__c shipmentDetail4 = new Shipment_Detail__c();  
        shipmentDetail4.Order_Header__c = orderHeader.Id;      
        shipmentDetail4.Shipment_Set_Number__c = 5.0;
        shipmentDetail4.CurrencyISOCode = 'USD';
        shipmentDetail4.Description__c = 'IIS OTHER';
        shipmentDetail4.Amount__c = 0.0;      
        shipmentDetail4.Shipped_Date__c = system.today().addDays(-3);
        shipmentDetail4.isShippingComplete__c = false;
        shipmentDetail4.Delivered_Date__c = system.today().addDays(-3);
        shipmentDetail4.isDeliveryComplete__c = false;
        shipmentDetail4.Completed_Date__c = null;   
        shipList.add(shipmentDetail4);
        insert shipList;
        system.runAs(u){
            try{
               CCP_OrderDataController.fetchOrderDetails(''); 
            }catch(exception ex){
                system.debug(ex.getMessage());
            }
            
            CCP_OrderDataController.fetchOrderDetails('1100');
            CCP_OrderDataController.fetchOrderDetails('110011');
        }
    }
    
}