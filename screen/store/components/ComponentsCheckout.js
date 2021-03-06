/* This software is in the public domain under CC0 1.0 Universal plus a Grant of Patent License. */
storeComps.CheckoutNavbar = {
  name: "orderNavbar",
  data() { return {}; },
  props: ["option"]
};
storeComps.CheckoutNavbarTemplate = getPlaceholderRoute("template_client_checkoutHeader", "CheckoutNavbar", storeComps.CheckoutNavbar.props);
Vue.component("checkout-navbar", storeComps.CheckoutNavbarTemplate);

storeComps.CheckOutPage = {
    name: "checkout-page",
    data: function() { return {
            cvv: "", showCvvError: false, homePath: "", storePath: "", customerInfo: {}, productsInCart: {}, shippingAddress: {}, shippingAddressSelect: {}, paymentMethod: {}, shippingMethod: {}, showProp65: "false",
            billingAddress: {}, billingAddressOption: "", listShippingAddress: [], listPaymentMethods: [],  promoCode: "", promoError: "", postalAddressStateGeoSelected: null,
            countriesList: [], regionsList: [], shippingOption: "", addressOption: "", paymentOption: "", isSameAddress: "0", shippingItemPrice: 0,
            isUpdate: false, isSpinner: false, responseMessage: "", toNameErrorMessage: "", countryErrorMessage: "", addressErrorMessage: "", 
            cityErrorMessage: "", stateErrorMessage: "", postalCodeErrorMessage: "", contactNumberErrorMessage: "", paymentId: 0, urlList: {}, 
            freeShipping:false, promoSuccess: "", stateGuestCustomer:2, selectShippingAddressStatus: 'active', selectShippingMethodStatus:0, selectPaymentMethodStatus:0, placeOrderStatus:0,
            listShippingOptions: [], optionNavbar:1, axiosConfig: { headers: { "Content-Type": "application/json;charset=UTF-8", "Access-Control-Allow-Origin": "*",
            "api_key":this.$root.apiKey, "moquiSessionToken":this.$root.moquiSessionToken } }
        }; 
    },
    computed: {
        shippingPrice: function () {
            return this.shippingMethod && this.shippingMethod.shippingTotal != undefined ? Number(this.shippingMethod.shippingTotal) : this.shippingItemPrice;
        },
    },
    methods: {
        notAddressSeleted: function() {
            return (this.addressOption == null || this.addressOption == '' 
                || this.listShippingAddress == null || this.listShippingAddress.length == 0);
        },
        notPaymentSeleted: function() {
            return (this.paymentOption == null || this.paymentOption == '' 
                || this.listPaymentMethods == null || this.listPaymentMethods.length == 0);
        },
        getCustomerInfo: function() { CustomerService.getCustomerInfo(this.axiosConfig)
            .then(function (data) { this.customerInfo = data; }.bind(this)); },
        getCustomerShippingAddresses: function() {
            CustomerService.getShippingAddresses(this.axiosConfig).then(function (data) {
                this.listShippingAddress = data.postalAddressList || [];
                this.getCartInfo();
            }.bind(this));
        },
        onAddressCancel: function() {
            this.hideModal("addressFormModal");
        },

        onAddressUpserted: function(data) {
            this.shippingAddress = {};
            this.addressOption = data.postalContactMechId + ':' + data.telecomContactMechId;
            this.getCustomerShippingAddresses();
            this.hideModal("addressFormModal");
        },

        onCreditCardCancel: function() {
            this.hideModal("creditCardModal");
        },

        /**
         * Data is like so: 
         * "postalContactMechId" : "CustJqpAddr",
         * "paymentMethodId" : "100004",
         * "telecomContactMechId" : "CustJqpTeln"
        **/
        onCreditCardSet: function(data) {
            this.getCustomerPaymentMethods();
            this.hideModal("creditCardModal");
        },

        getCartShippingOptions: function() {
            ProductService.getCartShippingOptions(this.axiosConfig)
                .then(function (data) { 
                    this.listShippingOptions = data.shippingOptions;

                    for(var i in this.listShippingOptions){
                        if(!!this.listShippingOptions[i].shippingTotal){
                            this.listShippingOptions[i].shippingTotal = parseFloat(this.listShippingOptions[i].shippingTotal).toFixed(2);
                        }
                    }

                    // Look for shipping option
                    var option = this.listShippingOptions?
                               this.listShippingOptions.find(function(item) {return item.shipmentMethodDescription == "Ground Parcel"}):0;

                    // Update the shipping option value
                    if(!!option){
                        option.shippingTotal = parseFloat(this.shippingItemPrice).toFixed(2);
                        this.shippingOption = option.carrierPartyId + ':' + option.shipmentMethodEnumId;
                    }
                }.bind(this));
        },
        getRegions: function(geoId) { GeoService.getRegions(geoId).then(function (data){ this.regionsList = data.resultList; }.bind(this)); },
        getCartInfo: function() {
            ProductService.getCartInfo(this.axiosConfig).then(function (data) {
                if (data.postalAddress) {
                    this.postalAddressStateGeoSelected = data.postalAddressStateGeo;
                    this.addressOption = data.postalAddress.contactMechId + ':' + data.postalAddress.telecomContactMechId;
                    this.shippingAddressSelect = data.postalAddress;
                    this.shippingAddressSelect.contactNumber = data.telecomNumber.contactNumber;
                } else if (this.listShippingAddress.length) {
                    // Preselect first address
                    this.addressOption = this.listShippingAddress[0].postalContactMechId + ':' + this.listShippingAddress[0].telecomContactMechId;
                }

                if (data.paymentInfoList && data.paymentInfoList.length) {
                    this.paymentOption = data.paymentInfoList[0].payment.paymentMethodId;
                    this.billingAddressOption = data.paymentInfoList[0].paymentMethod.postalContactMechId + ':' +data.paymentInfoList[0].paymentMethod.telecomContactMechId;
                    this.selectBillingAddress(data.paymentInfoList[0]);
                    for(var x in this.listPaymentMethods) {
                        if(this.paymentOption === this.listPaymentMethods[x].paymentMethodId) {
                            this.selectPaymentMethod(this.listPaymentMethods[x]);
                            this.selectBillingAddress(this.listPaymentMethods[x]);
                            break;
                        }
                    }
                } else if (this.listPaymentMethods.length) {
                    // Preselect first payment option
                    this.paymentOption = this.listPaymentMethods[0].paymentMethodId;
                }

                this.productsInCart = data;
                this.setShippingItemPrice();
                this.afterDelete();
            }.bind(this));
        },
        setShippingItemPrice: function(){
            // Retrieve the ItemShipping from orderItemList
            var item = this.productsInCart.orderItemList?
                       this.productsInCart.orderItemList.find(function(item) {return item.itemTypeEnumId == 'ItemShipping'; }):0;
            // Parse the default value retrieved from orderItemList setting two decimal
            this.shippingItemPrice = parseFloat(item? item.unitAmount : 0);            
        },
        validateCvv: function () {
            var isCvvValid = new RegExp("^\\d{3,4}$").test(this.cvv);

            if (!isCvvValid) {
                this.showCvvError = true;

                return;
            }

            this.showCvvError = false;
            this.addCartBillingShipping();
            this.setCheckoutStepComplete('selectPaymentMethod');
            this.setOptionNavbar(4);
        },
        addCartBillingShipping: function() {
            var info = {
                "shippingPostalContactMechId":this.addressOption.split(':')[0], 
                "shippingTelecomContactMechId":this.addressOption.split(':')[1],
                "paymentMethodId":this.paymentOption, 
                "carrierPartyId":this.shippingOption.split(':')[0], 
                "shipmentMethodEnumId":this.shippingOption.split(':')[1]
            };
            ProductService.addCartBillingShipping(info,this.axiosConfig).then(function (data) {
                this.paymentId = data.paymentId;
                this.getCartInfo();
            }.bind(this)); 
        },
        setCheckoutStepComplete: function(step) { 
            switch (step){
                case "selectShippingAddress":
                    this.selectShippingAddressStatus = "complete";
                    break;
                case "selectShippingMethod":
                    this.selectShippingMethodStatus = "complete";
                    break;
                case "selectPaymentMethod":
                    this.selectPaymentMethodStatus = "complete";
                    break;
                case "placeOrder":
                    this.placeOrderStatus = "complete";
                    break;  
            }
        },    
        setOptionNavbar: function(option) {
            this.optionNavbar = option;
        },
        getCustomerPaymentMethods: function() {
            CustomerService.getPaymentMethods(this.axiosConfig)
                .then(function (data) {
                    this.listPaymentMethods = data.methodInfoList;
                    this.getCartInfo();
            }.bind(this));
        },
        placeCartOrder: function() {
            var data = { cardSecurityCodeByPaymentId: {} };
            data.cardSecurityCodeByPaymentId[this.paymentId] = this.cvv;

            this.isSpinner = true;
            ProductService.placeCartOrder(data,this.axiosConfig).then(function (data) {
                if(data.orderHeader != null) {
                    this.$router.push({ name: 'successcheckout', params: { orderId: data.orderHeader.orderId }});
                } else {
                    this.isSpinner = false;
                    this.showModal("modal-error");
                }
                if(data.messages.includes("error") && data.messages.includes("122")) {
                    this.responseMessage = "Please provide a valid Billing ZIP";
                } else {
                    this.responseMessage = data.messages;
                }
            }.bind(this)).catch(function (error) {
                this.isSpinner = true;
                this.responseMessage = error;
                this.showModal("modal-error");
            }.bind(this));
        },
        applyPromotionCode: function() {
            var dataCode = {promoCode: this.promoCode, orderId: this.productsInCart.orderHeader.orderId};
            ProductService.addPromoCode(dataCode,this.axiosConfig).then(function (data) {
                if(data.messages.includes("not valid")) {
                    this.promoError = data.messages;
                } else {
                    this.promoSuccess = data.messages;
                }
            }.bind(this));
        },
        deletePaymentMethod: function(paymentMethodId) {
            CustomerService.deletePaymentMethod(paymentMethodId,this.axiosConfig).then(function (data) {
                this.getCustomerPaymentMethods();
            }.bind(this));
        },
        deleteShippingAddress: function(contactMechId,contactMechPurposeId) {
            CustomerService.deleteShippingAddress(contactMechId,contactMechPurposeId, this.axiosConfig).then(function (data) {
                this.getCustomerShippingAddresses();
            }.bind(this));
        },
        updateProductQuantity: function(item) {
            var data = { "orderId": item.orderId, "orderItemSeqId": item.orderItemSeqId, "quantity": item.quantity };
            ProductService.updateProductQuantity(data, this.axiosConfig)
                .then(function (data) { this.getCartInfo(); }.bind(this));
        },
        afterDelete: function(){       
            let qtyProducts = 0 ;
            this.productsInCart.orderItemList.forEach(function(item){
                if(item.itemTypeEnumId == 'ItemProduct'){
                    qtyProducts = qtyProducts + 1;
                }
            });
            if(qtyProducts == 0){
                window.location.href = this.storePath;
            }   
        },
        deleteOrderProduct: function(item) {
            ProductService.deleteOrderProduct(item.orderId, item.orderItemSeqId, this.axiosConfig)
                .then(function (data) { this.getCartInfo(); }.bind(this));
        },
        selectBillingAddress: function(address) {
            this.paymentMethod.address1 = address.postalAddress.address1;
            this.paymentMethod.address2 = address.postalAddress.address2;
            this.paymentMethod.toName = address.postalAddress.toName;
            this.paymentMethod.attnName = address.postalAddress.attnName;
            this.paymentMethod.city = address.postalAddress.city;
            this.paymentMethod.countryGeoId = address.postalAddress.countryGeoId;
            if(typeof(address.telecomNumber) != 'undefined') {
                this.paymentMethod.contactNumber = address.telecomNumber.contactNumber;
            }
            this.paymentMethod.postalCode = address.postalAddress.postalCode;
            this.paymentMethod.stateProvinceGeoId = address.postalAddress.stateProvinceGeoId;
            this.responseMessage = "";
        },
        selectAddress: function(address) {
            this.shippingAddress = {};
            this.shippingAddress.address1 = address.postalAddress.address1;
            this.shippingAddress.address2 = address.postalAddress.address2;
            this.shippingAddress.toName = address.postalAddress.toName;
            this.shippingAddress.attnName = address.postalAddress.attnName;
            this.shippingAddress.city = address.postalAddress.city;
            this.shippingAddress.countryGeoId = address.postalAddress.countryGeoId;
            this.shippingAddress.contactNumber = address.telecomNumber.contactNumber;
            this.shippingAddress.postalCode = address.postalAddress.postalCode;
            this.shippingAddress.stateProvinceGeoId = address.postalAddress.stateProvinceGeoId;
            this.shippingAddress.postalContactMechId = address.postalContactMechId;
            this.shippingAddress.telecomContactMechId = address.telecomContactMechId;
            this.responseMessage = "";
        },
        selectPaymentMethod: function(method) {
            this.paymentMethod = {};
            this.paymentMethod.paymentMethodId = method.paymentMethodId;
            this.paymentMethod.description = method.paymentMethod.description;
            this.paymentMethod.paymentMethodTypeEnumId = method.paymentMethod.PmtCreditCard;
            this.paymentMethod.cardNumber = method.creditCard.cardNumber;
            this.paymentMethod.titleOnAccount = method.paymentMethod.titleOnAccount;
            this.paymentMethod.expireMonth = method.expireMonth;
            this.paymentMethod.expireYear = method.expireYear;
            this.paymentMethod.cardSecurityCode = "";
            this.paymentMethod.postalContactMechId = method.paymentMethod.postalContactMechId;
            this.paymentMethod.telecomContactMechId = method.paymentMethod.telecomContactMechId;
            this.responseMessage = "";
        },
        hideModal: function(modalId) { $('#'+modalId).modal('hide'); },
        showModal: function(modalId) { $('#'+modalId).modal('show'); },
        changeShippingAddress: function(data) {
            this.shippingAddressSelect = data.postalAddress;
            this.shippingAddressSelect.contactNumber = data.telecomNumber.contactNumber;
            this.postalAddressStateGeoSelected = {geoName: data.postalAddressStateGeo.geoName};
        },
        cleanShippingAddress: function() { this.shippingAddress = {}; this.isUpdate = false; },
        cleanPaymentMethod: function() { this.paymentMethod = {}; this.isUpdate = false; },
        resetData: function(){ 
            $("#modal-card-content").trigger('reset'); 
            this.paymentMethod = {};
            this.shippingAddress = {};
            this.isUpdate = false;
            this.shippingAddress.countryGeoId = 'USA';
        },
        clearCvv: function () {
            this.cvv = "";
        },
    },
    components: { "product-image": storeComps.ProductImageTemplate },
    mounted: function() {
        if (this.$root.apiKey == null) { 
            this.$router.push({ name: 'login'}); 
        } else {
            this.homePath = storeConfig.homePath;
            this.storePath = storeConfig.storePath;
            this.showProp65 = storeConfig.show_prop_65_warning;
            this.getCustomerInfo();
            this.getCartShippingOptions();
            this.getCustomerShippingAddresses();
            this.getCustomerPaymentMethods();
            this.getRegions('USA');
        }
    }
};
storeComps.CheckOutPageTemplate = getPlaceholderRoute("template_client_checkout", "CheckOutPage");

storeComps.SuccessCheckOut = {
    name: "success-checkout",
    data: function() { return {
        customerInfo: {}, deliveryPrice:0, ordersList:[], orderList:{},
        axiosConfig: { headers: { "Content-Type": "application/json;charset=UTF-8", "Access-Control-Allow-Origin": "*",
                "api_key":this.$root.apiKey, "moquiSessionToken":this.$root.moquiSessionToken } }
    }; },
    methods: {
        getCustomerInfo: function() { CustomerService.getCustomerInfo(this.axiosConfig)
            .then(function (data) { this.customerInfo = data; }.bind(this)); },
        getCustomerOrders: function() {
            CustomerService.getCustomerOrders(this.axiosConfig)
                .then(function (data) { this.ordersList = data.orderInfoList; }.bind(this));
        },
        getCustomerOrderById: function() {
            CustomerService.getCustomerOrderById(this.$route.params.orderId,this.axiosConfig)
                .then(function (data) { this.orderList = data; }.bind(this));
        },
        formatDate: function(date) {
            return moment(date).format('Do MMM, YY');
        }
    },
    components: { "product-image": storeComps.ProductImageTemplate },
    mounted: function() {
        this.homePath = storeConfig.homePath;
        this.getCustomerInfo();
        this.getCustomerOrderById();
    }
};
storeComps.SuccessCheckOutTemplate = getPlaceholderRoute("template_client_checkoutSuccess", "SuccessCheckOut");

storeComps.CheckoutContactInfoTemplate = getPlaceholderRoute("template_client_contactInfo", "contactInfo");
Vue.component("contact-info", storeComps.CheckoutContactInfoTemplate);

storeComps.CheckoutProp65Template = getPlaceholderRoute("template_client_prop65", "prop65Warning");
Vue.component("prop65-warning", storeComps.CheckoutProp65Template);