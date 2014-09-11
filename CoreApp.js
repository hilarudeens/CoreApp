/**
 *
 * NAME: CoreApp
 *
 * VERSION: 0.0.1
 *
 * AUTHOR: hilarudeens<hilar.udeen@gmail.com>
 *
 * LICENSE: https://github.com/hilarudeens/CoreApp/blob/master/LICENSE
 *
 * DESCRIPTION:
 * Library which is run on the top of knockout and jQuery. Emulate Backbone like
 * application structure.
 *
 * M-S-V-M-R
 *
 */
var CoreApp = window.CoreApp || (function() {"use strict";

	if (!window.jQuery || !window.ko) {
		throw new Error('Dependency error, Knockout and jQuery doesn\'t exist');
	}

	var CoreApp = {};

	// SETUP CONFIGURATION
	CoreApp.config = {
		basePath : '/',
		DEBUG : true
	};

	// SETUP GLOBAL
	CoreApp.globals = {};

	// BASE CLASS DEFINATION INSPIRED BY
	/**
	 * Simple JavaScript Inheritance
	 * By John Resig http://ejohn.org/
	 * MIT Licensed.
	 */
	// Inspired by base2 and Prototype
	(function() {
		var initializing = false, fnTest = /xyz/.test(function() { xyz;
		}) ? /\b_super\b/ : /.*/;

		// The base Class implementation (does nothing)
		var __ = this.Class = function() {
		};

		// Create a new Class that inherits from this class
		__.extend = function(prop) {

			var _super = this.prototype;

			// Instantiate a base class (but only create the instance,
			// don't run the init constructor)
			initializing = true;
			var prototype = new this();
			initializing = false;

			// Copy the properties over onto the new prototype
			for (var name in prop) {
				// Check if we're overwriting an existing function
				prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
					return function() {
						var tmp = this._super;

						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];

						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						var ret = fn.apply(this, arguments);
						this._super = tmp;

						return ret;
					};
				})(name, prop[name]) : prop[name];
			}

			// The dummy class constructor
			function Class() {

				// ADDED/MODIFIED BY COREAPP AUTHOR
				// PRIVATE NOTATION OR NAMING CONVENTION
				//
				// In general javascript, private attributes and methods are keept in closure
				// or an alternate way they are started with "underscore" like object._myAttribute,
				// "object._myFunction". This would be nice to warn other developer on using it.
				// Here I would like to suggest little different private notation. That is,
				// "object._.myAttribute" instead of "object._myAttribute" and object._.myFunction
				// instead of "object._myFunction". Because It is implicitly tells developer
				// "this._.<something>" is nice. If the developers trying to use "<abc instance>._.", then
				// it is kind of clear warning that the developer crossing the region.
				//
				// MAKE PRIVATE NOTATION AVAILABLE IN CLASS
				//
				// Here I have divided private notation in two types
				// That is, static private and dynmaic private notation.
				// Static private notation is function related. This means
				// any function can be private function. we have to tell that
				// by prefix underscore( _ ) with function name. Privated functions
				// are available in inhertited class. However it is not advisable to
				// use that function
				//
				// Next one dynamic notation is attributes related. This notation is
				// created along object initialization. We can access them by using
				// from "this" keyword as like as follows "this._.privateAttr"
				//
				if (!initializing && !this._)
					this._ = {};

				// All construction is actually done in the init method
				if (!initializing && this.init) {
					this.init.apply(this, arguments);

					// ADDED/MODIFIED BY COREAPP AUTHOR
					// After instance created "init" method override in object.
					// It is avoid trigger initialization menthod from created object.
					this.init = undefined;
				}

			}

			// Populate our constructed prototype object
			Class.prototype = prototype;

			// Enforce the constructor to be what we expect
			Class.prototype.constructor = Class;

			// ADDED/MODIFIED BY COREAPP AUTHOR
			// And make this class extendable
			// Class.extend = arguments.callee;
			// "extend" static function modified by "CoreApp" author
			// After creating class static function attached to extend.
			// Since "extend" function going to be unchanged,
			// Following line added for avoid duplicate copy of extend function.
			Class.extend = __.extend;
			return Class;
		};
	}).call( function(CA) {
		return CA._ = {};
	}(CoreApp));

	// Override basic class definition method and extension.
	// To keep changes in John Resig's definition private.
	CoreApp.BaseClass = CoreApp._.Class.extend({
		// Make constructor function
		init : function() {
			this._initObj();
		},
		_initObj : function() {
			var self = this;
			self.initObj.apply(self, arguments);
		},
		initObj : function() {
		}
	});

	CoreApp.clean = function(o) {
		// Clean the object
		var dump = o = undefined;
	};

	/**
	 * Function to stimulate mixins.
	 *
	 * @param {Object} destClass
	 * @param {Object} srcClass
	 * @param {Boolean} forceOverride
	 * @param {Array} attributes
	 */
	CoreApp.implements = function(destClass, srcClass, forceOverride, attributes) {
		var sourcePrototypes = srcClass.prototype;
		var destPrototypes = destClass.prototype;
		forceOverride = !!forceOverride;
		attributes = attributes || Object.getOwnPropertyNames(sourcePrototypes);
		attributes.forEach(function(attr, index) {
			if (!forceOverride && !!destPrototypes[attr])
				return;
			destPrototypes[attr] = sourcePrototypes[attr];
		});
	};

	/**
	 * Function to call callback functions when event is triggered.
	 *
	 * @param {String} eventName
	 */
	var trigger = function(eventName) {
		var self = this;
		var args = Array.prototype.slice.call(arguments, 0);
		args.unshift(self._.eventListeners);
		CoreApp.Event.trigger.apply(CoreApp.Event.trigger, args);
	};

	/**
	 * Function to register callback function for an event.
	 * @param {String} eventName
	 * @param {Function} callback
	 * @paran {Object} context Scope object
	 * @return {Boolean} return registration success status.
	 */
	var on = function(eventName, callback, context) {
		var self = this;
		var eventList = [];

		if (!self._.eventListeners[eventName]) {
			for (var eventName in self._.eventListeners)
			eventList.push(eventName);
			CoreApp.Exception.throwIt("Non standard event attachement, possible events are " + eventList.join(","));
			return false;
		}

		if ( typeof callback !== 'function') {
			CoreApp.Exception.throwIt("Attaching callback to " + eventName + " is not a function");
			return false;
		}

		self._.eventListeners[eventName].push({
			callback : callback,
			context : context
		});

		return true;
	};

	// DEFINE MODEL STRUCTURE
	var ModelPrototype = {
		// MODEL INITIALIZATIONS
		/**
		 * Constructor function to initialize Model.
		 *
		 * @param {Object} data Plain JSON/JS object.
		 */
		init : function(data) {
			this._super();
			this._initEventListeners();
			this._initObj(data || {});
			this._initSubscriptionRegistry();
			this._initChangeSubscribe();
		},
		/**
		 * Function to delegate constructor initialize process to outer
		 * public functions.
		 */
		_initObj : function() {
			var self = this;
			var args = Array.prototype.slice.call(arguments, 0)
			self._.collection = ko.observableArray([]);
			self.initObj.apply(self, args);
		},
		/**
		 * Function to initialize or register standard Model events.
		 */
		_initEventListeners : function() {
			var self = this;
			self._.eventListeners = {
				'change' : []
			};
		},
		/**
		 * Function to initialize register Model observable
		 * subscription.
		 */
		_initSubscriptionRegistry : function() {
			this._.subscriptions = [];
		},
		/**
		 * Function to initialize observable change event callback
		 * through knockout subscription method.
		 */
		_initChangeSubscribe : function() {
			var self = this;
			var subscriptionRef = null;
			for (var key in self._.attributes) {
				if (ko.isObservable(self._.attributes[key])) {
					subscriptionRef = self._.attributes[key].subscribe(self._change.bind(self, key));
					self._.subscriptions.push(subscriptionRef);
				}
			}
		},

		// MODEL CONSTRUCTOR DEFAULT
		/**
		 * To make contructor delegated public function "initObj" is an optional
		 * to application specific Model.
		 */
		initObj : function() {
		},

		// MODEL EVENT HANDLING
		/**
		 * Function to cature observable changes.
		 * @param {String} changedAttrName
		 * @param {*} Changed value can be Number/String/Boolean/Object
		 */
		_change : function(changedAttrName, changedValue) {
			var self = this;
			var changedModelRef = this;
			// Trigger event.
			self._trigger('change', changedModelRef, changedAttrName, changedValue);
		},
		/**
		 * Function to trigger register Viewmodel and template
		 * events
		 */
		_trigger : trigger,
		/**
		 * Function to add or hook callback functions with registered events.
		 */
		on : on,

		// MODEL PUBLIC INTERFACE FUNCTIONS
		/**
		 * Function to read Model data as JSON value.
		 * This is need to be implemented based on application
		 * logic.
		 */
		getJSON : function() {
			CoreApp.Exception.throwIt("getJSON function is decelered, but not defined");
		},
		/**
		 * Function to read Model data as JS object.
		 * This is need to be implemented based on application
		 * logic.
		 */
		getJS : function() {
			CoreApp.Exception.throwIt("getJS function is decelered, but not defined");
		},
		/**
		 * Function to read Model attribute value.
		 * This is need to be implemented based on application
		 * logic.
		 */
		getAttributes : function() {
			CoreApp.Exception.throwIt("getAttributes function is decelered, but not defined");
		}
	};

	// DEFINE STORE STRUCTURE
	var StorePrototype = {
		// STORE PROPERTIES
		model : '',
		// STORE INITIALIZATIONS
		/**
		 * Constructor function to initialize Store.
		 */
		init : function() {
			var self = this;
			self._initEventListeners();
			self._initModel();
			self._initObj();
		},
		/**
		 * Function to delegate constructor initialize process to outer
		 * public functions.
		 */
		_initObj : function() {
			var self = this;
			var args = Array.prototype.slice.call(arguments, 0)
			self._.collection = ko.observableArray([]);
			self.initObj.apply(self, args);
		},
		/**
		 * Function to initialize or register standard Store events.
		 */
		_initEventListeners : function() {
			var self = this;
			self._.eventListeners = {
				addOne : [],
				addAll : [],
				removeOne : [],
				removeAll : [],
				changeOne : []
			}
		},
		/**
		 * Function to initialize associated Model.
		 */
		_initModel : function() {
			var self = this;
			var model = self.model
			var TempClass = null;
			TempClass = CoreApp.evaluate(model);
			self._.model = TempClass;
		},
		/**
		 * Function to initialize Model change event listerner to
		 * capture observable chnages.
		 *
		 * @param {Object} model Dynamically created Model object.
		 */
		_initChangeSubscribe : function(model) {
			var self = this;
			// Subscribe change
			model.on('change', function() {
				// It's safe to make copy of incoming arguments
				var args = Array.prototype.slice.call(arguments, 0);
				args[0] = args[0].getJS();
				// Dispatch change event
				var self = this;
				args.unshift('changeOne');
				self._trigger.apply(self, args);
			}, self);
		},
		// STORE CONSTRUCTOR DEFAULT
		/**
		 * To make contructor delegated public function "initObj" is an optional
		 * to application specific Model.
		 */
		initObj : function() {
		},

		// STORE EVENT HANDLING
		/**
		 * Function to trigger register Viewmodel and template
		 * events
		 */
		_trigger : trigger,
		/**
		 * Function to add or hook callback functions with registered events.
		 */
		on : on,

		// STORE PUBLIC INTERFACE FUNCTIONS
		/**
		 * Function to fetch reference of associated Model.
		 *
		 * @return {Object}
		 */
		getModel : function() {
			var self = this
			return self._.model
		},

		/**
		 * Function to insert single Model object in to
		 * Store.
		 *
		 * @param {Object} dataItem Plain JSON/JS object.
		 * @return {Object} JS version of added model.
		 */
		addOne : function(dataItem) {
			var self = this;
			var Model = self.getModel();
			var model = new Model(dataItem);
			// Register event for model value change
			// Keep add subscription before add into collection.
			// Since collection in knockout binding, once the model
			// added into collection, it will be render in UI.
			// In this, "Store" should have ability to monitor listen.
			self._initChangeSubscribe(model);
			self._.collection.push(model.getAttributes());

			// Trigger event
			self._trigger('addOne', model.getAttributes());
			return model.getJS();
		},
		/**
		 * Function to remove/delete single Model object from Store.
		 *
		 * @param {Object} dataItem
		 * @praam {Object} match [Optional] Object gives matchable key and respective value.
		 *
		 * @return {Object} Removed Model object.
		 */
		removeOne : function(dataItem, match) {
			var self = this;
			var removable = dataItem;
			if (match) {
				removable = (function(match) {
					return function(val) {
						return val[match.key] === match.value
					}
				})(match);
			}
			var removedItem = self._.collection.remove(removable);

			// Trigger event
			self._trigger('removeOne', removedItem);
			return removedItem;
		},
		/**
		 * Function to insert multiple Model objects in to
		 * Store.
		 *
		 * @param {Array} dataItems Plain JSON/JS object.
		 * @return {Object} A collection inserted Model's JS version.
		 */
		addAll : function(dataItems) {
			var self = this;
			var receivedModels = [];
			dataItems.forEach(function(dataItem) {
				receivedModels.push(self.addOne(dataItem));
			});
			// Trigger events.
			self._trigger('addAll', receivedModels);
			return receivedModels;
		},
		/**
		 * Function to remove/delete multiple Model objects from Store.
		 *
		 * @param {Object} dataItems
		 * @praam {String} matchKey [Optional] Key to match while delete.
		 *
		 * @return {Array} Removed Model objects.
		 */
		removeAll : function(dataItems, matchKey) {
			var self = this;
			var receivedModels = []
			if (dataItems && dataItems.length > 0) {
				dataItems.forEach(function(dataItem) {
					var match = {
						key : matchKey,
						value : dataItem[matchKey]
					};
					receivedModels.push(self.removeOne(dataItem, !matchKey||match)[0]);
				});
			} else {
				receivedModels = self._.collection.removeAll();
			}
			// Trigger events.
			self._trigger('removeAll', receivedModels);
			return receivedModels;
		},

		/**
		 * Function read single model in Store.
		 */
		readOne : function(mode) {
			// TO DO: Needs to implement if require
		},
		/**
		 * Function read multiple Models in Store.
		 * @param {String} mode Readable mode to iniducated plain JS or Observable.
		 * @return {Object}
		 */
		readAll : function(mode) {
			// mode can be Observable.
			mode = mode || 'AS_OBSERVABLE';
			var self = this;
			var collection = self._.collection;
			return mode === 'AS_OBSERVABLE' ? collection : ko.toJS(collection);
		},
	};

	// DEFINE VIEWMODELS STRUCTURE
	var ViewmodelPrototype = {
		// VIEWMODEL PROPERTIES
		autoRender : true,
		targetElem : '',
		renderAnimation : '', // jQuery render animation
		renderAnimDelay : 0, // Delay
		template : '',
		modelConfig : {},
		storeConfig : {},
		childViewmodelConfig : {},

		// VIEWMODEL INITIALIZATIONS
		/**
		 * Constructor function to initialize viewmodel.
		 *
		 * @param {Object} parentRef level up viewmodel object.
		 */
		init : function(parentRef) {
			var self = this;
			self._.parentRef = parentRef;

			if (self._.parentRef && self.autoRender)
				self._.parentRef.on('afterRenderTemplate', self._initTemplate, self);

			self._initEventListeners();
			self._initObj(parentRef);

			self._initModels();
			// Trigger on after init model
			self._trigger('modelReady', self._.models);

			self._initStores();
			// Trigger on after init store
			self._trigger('storeReady', self._.stores);

			// Whenever vm object getting initiated we have to make sure
			// respective template availability. Following function call
			// check local existance of template and if it is not local dom
			// it will pull template.
			if (self.template && self.autoRender) {
				self._initTemplate();
			} else {
				self._loadTemplate();
			}
			self._initChildViewmodels();
			self._trigger('afterViewmodelInit');
		},
		/**
		 * Function to delegate constructor initialize process to outer
		 * public functions.
		 *
		 */
		_initObj : function() {
			var self = this;
			var args = Array.prototype.slice.call(arguments, 0)
			self.initObj.apply(self, args);
		},
		/**
		 * Function to initialize models.
		 */
		_initModels : function() {
			var self = this;
			var modelConfig = self.modelConfig;
			var models = {};
			var TempClass = null;
			for (var modelAlias in modelConfig) {
				TempClass = CoreApp.evaluate(modelConfig[modelAlias]);
				models[modelAlias] = new TempClass();
			}
			self._.models = models;
		},
		/**
		 * Function to initialize stores.
		 */
		_initStores : function() {
			var self = this;
			var storeConfig = self.storeConfig;
			var stores = {};
			var TempClass = null;
			for (var storeAlias in storeConfig) {
				TempClass = CoreApp.evaluate(storeConfig[storeAlias]);
				stores[storeAlias] = new TempClass();
			}
			self._.stores = stores;
		},
		/**
		 * Function initialize composite leaf/siblings viewmodels.
		 */
		_initChildViewmodels : function() {
			var self = this;
			var childVmConfig = self.childViewmodelConfig;
			var childViewmodels = {};
			var TempClass = null;

			for (var childVmAlias in childVmConfig) {
				TempClass = CoreApp.evaluate(childVmConfig[childVmAlias]);
				childViewmodels[childVmAlias] = new TempClass(self);
			}

			self._.childViewmodels = childViewmodels;
		},

		/**
		 * Function to initialize or register standard viewmodel event and template
		 * management events.
		 */
		_initEventListeners : function() {
			var self = this;
			self._.eventListeners = {
				modelReady : [],
				storeReady : [],
				templateReady : [],
				beforeRenderTemplate : [],
				afterRenderTemplate : [],
				afterViewmodelInit : []
			}
		},

		// VIEWMODEL DEFAULTS
		/**
		 * To make contructor delegated public function "initObj" is an optional
		 * to application specific viewmodel.
		 */
		initObj : function() {
		},

		// VIEWMODEL TEMPLATE PROCESS
		/**
		 * Function to read template either from local or remote and
		 * trigger compile and rendering process.
		 */
		_initTemplate : function() {
			var self = this;
			var $parentElem = null;
			$parentElem = self._getParentElem();
			// Check parent element is there and skip process
			if (self._.parentRef && $parentElem === null) {
				// Skip rendering process
				return;
			}

			// 1. Pull template
			self._loadTemplate().always(function(htmlString) {

				// 2. Check and cleam dom if current template already rendered in dom
				self._cleanDoms();

				// 3. Compile Template
				self._templateProcess(htmlString);

				self._trigger('templateReady');
				self._trigger('beforeRenderTemplate');

				// 4. Render template
				self._renderTemplate();

				self._trigger('afterRenderTemplate');
			});

		},
		/**
		 * Function to compile template and generate valid
		 * DOM element.
		 *
		 * @param {String} htmlString Html text.
		 * @return {Object} jQuery DOM elements
		 */
		_templateCompile : function(htmlString) {
			var $elems = htmlString ? $('<div>').html(htmlString) : $('<div>');
			return $elems.children();
		},
		/**
		 * Function to read parent viewmodel's associated HTML elements.
		 */
		_getParentElem : function() {
			var self = this;
			var $parentElem = null;
			if (self._.parentRef) {
				$parentElem = $(self._.parentRef._.$elems);
			}
			return $parentElem
		},
		/**
		 * Function to render the compiled DOM elements in to
		 * existing "document".
		 */
		_renderDoms : function() {
			var self = this;
			var $target = null;
			if (!( $target = self._getParentElem() && $target && $target.length)) {
				$target = $('body');
			}
			if ($target.length) {
				$target.find(self.targetElem).append(self._.$elems);
				//$([$target,$target.parent()]).find(self.targetElem).append(self._.$elems);
				//$target.find('*').addBack().filter(self.targetElem).append(self._.$elems);
			}
		},
		/**
		 * Function to read template.
		 *
		 * @return {Object} jQuery "Promise" object.
		 */
		_loadTemplate : function() {
			var self = this;
			return CoreApp.managers.Template.load(self.template);
		},
		/**
		 * Function to clean rendered DOM properly.
		 * Cleaing process is include both deattach DOM events
		 * and remove the elements from "document".
		 */
		_cleanDoms : function() {
			var self = this;
			var $elems = self._.$elems;
			var ref = null;


			// Clean existing template content
			if ($elems && $elems.length) {
				// /////////////////////////////////////////////
				// For performance tune following cleanup code, replace with 
				// native javascript remove() function
				// /////////////////////////////////////////////
				
				// // Deattach all jQuery event binding
				// $elems.off();
				// 
				// $.each($elems, function(elemIndex, node) {
				// 	// Deattach knockout binding and remove node within target DOM
				// 	ko.removeNode(node);
				// });
				// 
				// // Deattach knockout binding at target DOM
				// ko.cleanNode($elems[0]);

				// $elems.remove();
				
				// ///////////////////////
				// Optimized code
				// //////////////////////
				for(var i=0;i<$elems.length;i++){
					$elems[i].remove();
				}
			}

		},
		/**
		 * Function to do Knockout bindngs on compiled
		 * template.
		 */
		_koApplyBindings : function(data) {
			var self = this;
			$.each(self._.$elems, function(key, elem) {
				ko.applyBindings(data, elem);
			});
		},
		/**
		 * Function to compile and create local reference for
		 * DOM elements.
		 */
		_templateProcess : function(templateString) {
			var self = this;
			var $elems = self._templateCompile(templateString);
			self._.$elems = $elems;
		},
		/**
		 * Function to trigger DOM render.
		 */
		_renderTemplate : function() {
			var self = this;
			self._renderDoms();
		},
		/**
		 * Public interface function to render template.
		 * It is used for manualy trigger rendering process
		 * when "autoRender" is disabled.
		 */
		renderTemplate : function() {
			var self = this;
			self._initTemplate();
		},
		cleanDoms : function() {
			var self = this;
			self._cleanDoms();
		},
		// VIEWMODEL EVENT HANDLING
		/**
		 * Function to trigger register Viewmodel and template
		 * events
		 */
		_trigger : trigger,
		/**
		 * Function to add or hook callback functions with registered events.
		 */
		on : on,

		// VIEWMODEL PUBLIC INTERFACE FUNCTIONS
		/**
		 * Function to read or get reference to Models which is associated
		 * with current viewmodel.
		 *
		 * @param {String} modelName String to mention model name.
		 * @return {Object} Reference to "Model" object.
		 */
		getModel : function(modelName) {
			var self = this;
			var model = self._.models[modelName]
			if (!model) {
				CoreApp.Exception.throwIt(modelName + ' store doesn\'t exist in current ViewModel');
				return {};
			}
			return model;
		},
		/**
		 * Function to read or get reference to Stores which is associated
		 * with current viewmodel.
		 *
		 * @param {String} storeName String to mention store name.
		 * @return {Object} Reference to "Store" object.
		 */
		getStore : function(storeName) {
			var self = this;
			var store = self._.stores[storeName]
			if (!store) {
				CoreApp.Exception.throwIt(storeName + ' store doesn\'t exist in current ViewModel');
				return {};
			}
			return store;
		},
		/**
		 * Function to read or get reference to composite sibiling viewmodels which is associated
		 * with current viewmodel.
		 *
		 * @param {String} viewmodelName String to mention viewmodel name.
		 * @return {Object} Reference to "Viewmodel" object.
		 */
		getComponent : function(viewmodelName) {
			var self = this;
			var viewmodel = self._.childViewmodels[viewmodelName]
			if (!viewmodel) {
				CoreApp.Exception.throwIt(viewmodelName + ' child component viewmodel doesn\'t exist in current ViewModel');
				return {};
			}
			return viewmodel;
		}
	};

	// EXTEND MODEL, STORE, VIEWMODEL PROTOTYPES FROM BASE CLASS
	CoreApp.models = CoreApp.models || {};
	CoreApp.models.BaseModel = CoreApp.BaseClass.extend(ModelPrototype);
	CoreApp.stores = CoreApp.stores || {};
	CoreApp.stores.BaseStore = CoreApp.BaseClass.extend(StorePrototype);
	CoreApp.viewmodels = CoreApp.viewmodels || {};
	CoreApp.viewmodels.BaseViewmodel = CoreApp.BaseClass.extend(ViewmodelPrototype);

	// DEFINE PROXY STRUCTURE
	var ProxyPrototype = {
		ajax : function(ajaxOptions) {
			var self = this;
			if (!ajaxOptions.url) {
				CoreApp.Exception.throwIt("Url is not defined");
				return false;
			}
			ajaxOptions.type || (ajaxOptions.type = 'GET');
			return $.ajax(ajaxOptions);
		}
	};

	// EXTEND PROXY PROTOTYPE FROM BASE CLASS
	CoreApp.proxies = CoreApp.proxies || {};
	CoreApp.proxies.BaseProxy = CoreApp.BaseClass.extend(ProxyPrototype);

	// MANAGERS
	// Managers are singleton object and do some automated
	// process. Managers doesn't need explicit call from
	// application logic.
	CoreApp.managers = CoreApp.managers || {};

	// DEFINE ROUTER/NAVIGATION MANAGER
	var RouterPrototype = {
		// PRIVATE FUNCTIONS
		_initEventListeners : function() {
			var self = this;
			self._.eventListeners = {
				beforeRoute : [],
				afterRoute : [],
				refresh : [],
				reload : []
			}
		},
		_parseHash : function(hash) {
			var parsed = {};
			var hashTokens = hash.split('/');
			var modified = [];
			var params = [];

			hashTokens.forEach(function(token) {
				if (token.indexOf(':') === 0) {
					params.push(token.replace(":", ''));
					modified.push('([^/]+)');
				} else {
					modified.push(token);
				}
			});

			return {
				params : params,
				hashPatt : modified.join('/') + '$'
			};
		},
		_getParent : function(routeRef) {

		},
		_createRoute : function(key, hash, cb, name, parentKey, rootKey) {
			var self = this;
			var hashParses = self._parseHash(hash);

			self._.routes[hashParses.hashPatt] = {
				params : hashParses.params,
				routeMapRef : key
			}, self._.routeMap[key] = {
				name : name || '',
				parent : parentKey || key,
				root : rootKey || parentKey || key,
				hash : hash,
				cb : cb,
			}
		},
		_createRoutes : function(route, key) {
			var self = this;
			key = key || ('route' + Math.random().toString().split('.')[1]);
			self._createRoute(key, route.hash, route.cb, route.name, route.parent, route.root);
		},
		// INITIALIZE ROUTER
		_initRoutes : function(routes) {
			var self = this;
			self._.routes = {};
			self._.routeMap = {};
			for (name in routes) {
				self._createRoutes(routes[name], name)
			}
		},
		// _trigger: function(eventName){
		// var args = Array.prototype.slice.call(arguments,1);
		// var self = this;
		// var eventListener = self._.eventListeners[eventName];
		// eventListener.forEach(function(listener){
		// listener.callback.call()
		// })
		// },
		beforeRoute : function() {
			return true;
		},
		afterRoute : function() {
			return true;
		},
		completeRoute : function() {

		},
		// CONSTRUCTOR
		init : function(routes) {
			var self = this;
			self._initEventListeners();
			self._initRoutes(routes);
		},
		// PUBLIC FUNCTIONS
		// on: on,
		getHierarchy : function(hash) {
			var leafToRoot = []
			var self = this;
			var routeMap = self._.routeMap;
			var routerRef = self.lookup(hash);
			//rootToleaf.push(routerRef);
			var _getHierarchy = function(collection, routeMap, ref) {
				collection.push(routeMap[ref])
				if (routeMap[ref].root === ref) {
					return collection;
				} else {
					return _getHierarchy(collection, routeMap, routeMap[ref].parent);
				}
			};
			_getHierarchy(leafToRoot, routeMap, routerRef.ref);
			return leafToRoot;
		},
		getTitleByHash : function(hash) {
			var self = this;
			var routerRef = self.lookup(hash);
			var routeMap = self._.routeMap[routerRef.ref];
			return routeMap.name || '';
		},
		getTitleByRef : function(ref) {
			var self = this;
			var routeMap = self._.routeMap[ref];
			return routeMap ? routeMap.name : '';
		},
		getHash : function(routerRef) {
			var self = this;
			var routeMap = self._.routeMap[routerRef];
			if (routeMap)
				return routeMap.hash;
			else
				return false
		},
		getRoute : function() {

		},
		getAllRoutes : function() {

		},
		reload : function(reloadHash) {
			var self = this;
			self.load(reloadHash.replace('#', ''));
		},
		redirect : function(redirectHash) {
			location.hash = redirectHash;
		},
		load : function(hash) {
			var self = this;
			var routeRef = self.lookup(hash);
			var routeMap = self._.routeMap[routeRef.ref];

			if (self.beforeRoute(hash, routeMap) !== false && location.hash.replace('#', '') === hash && !!routeMap.cb) {
				routeMap.cb.call(routeRef.params);
				self.afterRoute(hash, routeMap);
			}

			if (location.hash.replace('#', '') === hash)
				self.completeRoute(hash, routeMap);
		},
		lookup : function(hash) {
			var self = this, hashMatch = [], params = {}, datatypePatt = /([a-z]+)(\{(Boolean|Number|String)\})?/i, check = '', parsedHashes = self._.routes;
			for (var hashPatt in parsedHashes) {
				hashMatch = hash.match(hashPatt);
				if (!hashMatch || hashMatch.index === -1) {
					hashPatt = null;
					continue;
				}
				var param = '';
				(hashMatch.slice(1)).forEach(function(paramValue, index) {
					switch((param = parsedHashes[hashPatt].params[index].match(datatypePatt).slice(1))[2]) {
						case 'NUMBER':
						case 'number':
						case 'Number':
							params[param[0]] = parseFloat(paramValue);
							break;
						case 'BOOLEAN':
						case 'boolean':
						case 'Boolean':
							params[param[0]] = paramValue.trim() !== 'false' ? !!paramValue.trim() : false;
							break;
						default:
							params[param[0]] = paramValue;
							break;
					}
				});
				break;
			}
			return !!hashPatt ? {
				params : params,
				ref : parsedHashes[hashPatt].routeMapRef
			} : null;
		},
		run : function() {
			var self = this;
			var bindedLookup = function() {
				this.load(window.location.hash.replace('#', ''));
			}.bind(self);
			$(window).on('hashchange', bindedLookup);
			// Manual trigger the event on load
			self.load(window.location.hash.replace('#', ''));
		}
	};

	CoreApp.managers.BaseRouter = CoreApp.BaseClass.extend(RouterPrototype);

	// DEFINE CACHE MANAGER
	var CachePrototype = {};
	CoreApp.managers.BaseCache = CoreApp.BaseClass.extend(CachePrototype);

	// DEFINE GLOBAL EVENT MANAGER OR PUBSUB MANAGER
	var GlobalEventPrototype = {
		// PRIVATE FUNCTIONS
		_initEventListeners : function() {
			var self = this;
			self._.eventNames = [];
			self._.eventListeners = {
			};
		},
		// CONSTRUCTOR
		init : function() {
			var self = this;
			self._initEventListeners();
		},
		// PUBLIC FUNCTIONS
		registerEvent : function(eventNames) {
			var self = this;
			if (CoreApp.utils.isString(eventNames))
				eventNames = eventNames.split(',')
			self._.eventNames = eventNames;
			eventNames.forEach(function(eventName) {
				// Remove if any space prefix and suffix
				eventName = eventName.trim();
				if (!self._.eventListeners[eventName]) {
					self._.eventListeners[eventName] = [];
				} else {
					CoreApp.Exception.throwIt('Event registration failed, because ' + eventName + ' event already exist');
				}
			});
		},
		removeHandlers : function(eventNames) {
			var self = this;

			if (!eventNames)
				eventNames = self._.eventNames;

			if (CoreApp.utils.isString(eventNames))
				eventNames = eventNames.split(',');

			eventNames.forEach(function(eventName) {
				if (self._.eventListeners[eventName]) {
					self._.eventListeners[eventName] = [];
				}
			});
		},
		trigger : trigger,
		on : on
	};
	CoreApp.managers.BaseGlobalEvent = CoreApp.BaseClass.extend(GlobalEventPrototype);

	// DEFINE TEMPLATE LOAD MANAGER
	var Template = {
		config : {
			pathPrefix : 'templates/',
			extension : 'html',
			namePrefix : ''
		},
		load : function(template) {
			var self = this;
			var config = self.config;
			var deferred = $.Deferred();
			var templateName = template;
			var basePath = config.basePath;
			var pathPrefix = config.pathPrefix || '/';
			var namePrefix = config.namePrefix;
			var extension = '.' + (config.extension || 'html');
			var url = basePath + pathPrefix + namePrefix + templateName + extension;

			// Check catched and read from dump
			if ($('#' + templateName).length) {
				setTimeout(function() {
					deferred.resolve($('#' + templateName).html());
				}, 0);
			} else {
				$.ajax({
					url : url,
					dataType : 'text',
					method : "GET"
				}).done(function(data) {
					// Catch and dump into dom.
					var template = $('<script type="text/html" id="' + templateName + '">')
					template.html(data)
					$('body').last().append(template);
					deferred.resolve(data);
				});
			}
			return deferred;
		}
	};
	CoreApp.managers.Template = Template;

	// DEFINE EXCEPTION SINGLETON
	var Exception = {
		throwIt : function(e) {
			try {
				if ( e instanceof Error) {
					throw e
				} else if ( typeof e === 'string') {
					throw new Error(e);
				} else {
					throw new Error("call stack")
				}
			} catch(e) {
				if (CoreApp.config.DEBUG)
					!console || !console.log || console.log(e.stack);
			}
		}
	}
	CoreApp.Exception = Exception;

	// DEFINE EVENT SINGLETON
	CoreApp.Event = {
		trigger : function(eventListers, eventName) {
			var args = Array.prototype.slice.call(arguments, 2);
			if (eventListers[eventName]) {
				eventListers[eventName].forEach(function(cbItems) {
					cbItems.callback.apply(cbItems.context, args);
				});
			} else {
				CoreApp.Exception.throwIt("Event listener doesn't contain '" + eventName + "' event.");
			}
		}
	};

	/**
	 * Function to evaluate javascript statement.
	 *
	 * @param {String} string
	 * @return {Object}
	 */
	var _evaluate = function(string) {
		/**
		 * Function to validate in-coming string before proceed
		 * evaluate operation.
		 *
		 * @param {Function} isValidEvalStatement
		 * @param {string} string
		 * @return {boolean}
		 */
		var isValidEvalStatement = function(string) {
			// All require validation on input string against
			// any vulnerability threats.

			// There is no gain in executables without either
			// "()" -> denote function call
			// OR
			// "=" -> assignment operator
			// Hence following validation enough, to check executable vulnerability
			// in javascript.
			// Checking "(" and "=" existance in input string.

			// TO DO: Here I have to analyse about bit-wise operator.

			// And There is chance to external simply passing the object literal
			// like {foo:'bar'} or {...<some heavy>...} and can make unwanted load.
			// Hence open brace also included in validation.
			return !( typeof string !== 'string' || string.indexOf('(') !== -1 || string.indexOf('=') !== -1 || string.indexOf('{') !== -1);
		};

		if ( typeof string !== 'string')
			CoreApp.Exception.throwIt("Input is not a string, can not proceed eval");
		if (isValidEvalStatement(string)) {
			try {
				return Function("return "+string)();
			} catch(e) {
				CoreApp.Exception.throwIt(e);
			}
		}
		CoreApp.Exception.throwIt("Security issue, can not proceed eval on " + string);
		return false;
	};

	// DEFINE APPLICATION
	CoreApp.BaseApplication = (function() {
		// Closure scope.
		var ApplicationPrototype = {
			init : function() {
				var self = this;
				self._.viewmodels = {};
			},
			loadTemplate : function(templateName) {
				return CoreApp.managers.Template.load(templateName);
			},
			clean : function(domRef) {
				ko.removeNode(domRef);
			},
			evaluate : function(string) {
				return CoreApp.evaluate(string);
			}
		}
		return CoreApp.BaseClass.extend(ApplicationPrototype);
	})();

	// BASIC COREAPP FUNCTIONS
	CoreApp._.eval = _evaluate;
	CoreApp.evaluate = function(string) {
		return this._.eval(string);
	};
	CoreApp.moduleToFile = CoreApp.mtof = function(modules) {
		var files = [];
		var ensure = []

		var ensureModule = function(modulestring) {
			var base = window;
			(modulestring.split('.')).forEach(function(moduleToken, index, self) {
				// Assume end token is file name and skip object
				// initialization process.
				if (index === self.length - 1)
					return

				if (!base[moduleToken]) {
					base[moduleToken] = {};
				}
				base = base[moduleToken];
			});
		};

		var checkLoadedModule = function(module) {
			return !!CoreApp.evaluate(module)
		};

		if (CoreApp.utils.isString(modules))
			modules = modules.split(',')

		modules.forEach(function(module) {
			ensureModule(module);
			if (checkLoadedModule(module) === false)
				files.push(module.split('.').join('/'));
		});
		return files;
	};

	// UTILITIES
	CoreApp.utils = {
		_ : {
			id : 0
		},
		/**
		 * Function to generate unique id.
		 * And it is borrowed from underscore _.uniqueId.
		 *
		 * @param {Object} prefix
		 * @return {Number}
		 */
		getUniqueId : function(prefix) {
			return (prefix || '') + this._.id++;
		},
		isArray : function(obj) {
			return Object.prototype.toString.call(obj) === '[object Array]';
		},
		isString : function(obj) {
			return Object.prototype.toString.call(obj) === '[object String]';
		}
	};

	return CoreApp;
})();
