@isTest
private class CCP_OrderHeaderScheduleTest {

    static testMethod void testOrderBatchSchedule(){
        String CRON_EXP = '0 0 0 15 3 ? 2022';
        Order__c testOrder = new Order__c();
        testOrder.Name = '110011-1-1';
        testOrder.Global_Order_Number__c = '110011';
        insert testOrder;
        Test.startTest();
        try{
           String jobId = System.schedule('ScheduleApexClassTest',
                        CRON_EXP, 
                        new CCP_OrderHeaderSchedule()); 
        }catch(exception ex){
            system.debug(ex.getMessage());
        }
        
        Test.stopTest();
    }
    
}