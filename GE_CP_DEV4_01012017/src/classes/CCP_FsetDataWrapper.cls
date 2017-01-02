public class CCP_FsetDataWrapper implements Comparable {
	@AuraEnabled
    public string ShipmentSet;
    @AuraEnabled
    public string Description;
    @AuraEnabled
    public decimal Amount;
    @AuraEnabled
    public string ShippingAddress;
    @AuraEnabled
    public string InititatedDate;
    @AuraEnabled
    public string ShippedDate;
    @AuraEnabled
    public string DeliveredDate;
    @AuraEnabled
    public string CompletedDate;
    @AuraEnabled
    public boolean isShippingComplete;
    @AuraEnabled
    public boolean isDeliveryComplete;
    @AuraEnabled
    Public string currencyCode;
    @AuraEnabled
    public string ShippingText;
    @AuraEnabled
    public string DeliveryText;
    public date initiatedDate_ISO;
    public date shippeddate_ISO;
    public date delivereddate_ISO;
    public date completeddate_ISO;
    public string addressCity;
    @AuraEnabled
    public string addressLine1;
    @AuraEnabled
    public string addressLine2;
    @AuraEnabled
    public string addressLise3;
    public string addressLine4;
    public string addressState;
    public string addressZip;
    public string CustomerName;
    public string addressCountry;
    public Integer compareTo(Object objToCompare) {
        integer val1 = integer.valueOf(ShipmentSet);
        integer val2 = integer.valueOf(((CCP_FsetDataWrapper)objToCompare).ShipmentSet);
        if (val1 == val2) 
            return 0;
        if (val1 > val2) 
            return 1;
        return -1;
    }
}