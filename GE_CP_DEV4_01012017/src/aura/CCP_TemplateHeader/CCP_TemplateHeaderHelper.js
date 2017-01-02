({
	fetchUser : function(component) {
		var action = component.get("c.fetchUserDetails");
        action.setCallback(this, function(response){
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                component.set("v.loggedInUserName", response.getReturnValue());
            }
			else if (state === "ERROR"){
                var errors = action.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                    	console.log(errors[0].message);
                    }
                }
            }
        });
        $A.enqueueAction(action);
	},
    
    fetchHeadDisclaimer : function(component){
        var action = component.get("c.fetchDisclaimer");
        action.setCallback(this, function(response){
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                component.set("v.headerDisclaimer", response.getReturnValue());
            }
			else if (state === "ERROR"){
                var errors = action.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                    	console.log(errors[0].message);
                    }
                }
            }
        });
        $A.enqueueAction(action);
    }
})