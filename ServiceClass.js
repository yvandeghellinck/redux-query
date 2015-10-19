let constants = require('./constants');

import $ from 'jquery';
import _ from 'underscore';

export const ServiceState = {
	EXECUTE: 'EXECUTE',
	ERROR: 'ERROR',
	FINISH: 'FINISH'
}

export const methods = {
	READ   		: 'READ',
	DESTROY  	: 'DESTROY',
	UPDATE 		: 'UPDATE',
	SAVE 		: 'SAVE'
}

const methodsMapper = {
	READ   		: 'GET',
	DESTROY  	: 'DELETE',
	UPDATE 		: 'PUT',
	SAVE 		: 'POST'
}

export const ServiceClass = class ServiceClass {
	
	static asAction(docName, serviceState = ServiceState.FINISH) {
		return constants.API_CALL+'_'+docName+'_'+serviceState;
	}

	constructor(docName, action, url, data, dispatcher, options) {

		this.type = constants.API_CALL;

		this.docName = docName;
		this.action = action;
		this.url = url;
		this.data = data;
		this.options = options || {};

		this.dispatch = dispatcher;
		this.launchStartDispatch();
		this.launchRequest();

	}

	isFinished() {
		return this.state == ServiceState.FINISH;
	}

	isExecuting() {
		return this.state == ServiceState.EXECUTE;
	}

	hasAnError() {
		return this.state == ServiceState.error;
	}

	launchStartDispatch() {
		this.state = ServiceState.EXECUTE;
		this.launchDispatch();
	}

	launchRequest() {
		var self = this;
		// setTimeout(function() {
			var options = {
				'method': methodsMapper[self.action],
				'contentType': 'application/json; charset=utf-8',
				'success': (data)=>{
					self.state = ServiceState.FINISH;
					self.data = data;
					self.launchDispatch();
				},
				'fail': (error)=>{
					self.state = ServiceState.ERROR;
					self.error = error;
					self.launchDispatch();
				}
			};
			if(self.data) {
				if(self.action == methods.READ) {
					options.data = self.data;
				} else {
					options.data = JSON.stringify(self.data);
				}
			}
			if(self.options.success){

				var defaultsSuccess = options.success;
				options.success = (res)=> {
					defaultsSuccess(res);
					self.options.success.apply(self, [res]);
				}
			}

			options = _.extend(options, this.options)
			$.ajax(self.url, options);	
		// }, Math.random()*2000);		
	}

	launchDispatch() {
		this.dispatch(this.serialize());
	}

	serialzedType() {
		return ServiceClass.asAction(this.docName, this.state)
	}

	serialize() {
		return {
			
			docName : this.docName,
			action : this.action,
			url : this.url,
			type : this.serialzedType(),
			
			state : this.state,
			data : this.data,
			error : this.error,

			isFinished : this.isFinished(),
			isExecuting : this.isExecuting(),
			hasAnError : this.hasAnError(),
			isAQuery : true,
			options : this.options
		}
	}
}
ServiceClass.ServiceState = ServiceState
