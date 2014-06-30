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

	CoreApp.clean = function(o) {
		// Clean the object
		var dump = o = undefined;
	};

	// Override basic class definition method and extension.
	// To keep changes in John Resig's definition private.
	CoreApp.BaseClass = CoreApp._.Class.extend({
		// Make constructor function
		init : function() {
		}
	});

	// Event trigger function definition
	var trigger = function(eventName) {
		var self = this;
		var args = Array.prototype.slice.call(arguments, 0);
		args.unshift(self._.eventListeners);
		CoreApp.Event.trigger.apply(CoreApp.Event.trigger, args);
	};

	// On function definition
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
		// PRIVATE FUNCTIONS
		_initSubscriptionRegistry : function() {
			this._.subscriptions = [];
		},
		_initObj : function() {
			var self = this;
			var args = Array.prototype.slice.call(arguments, 0)
			self._.collection = ko.observableArray([]);
			self.initObj.apply(self, args);
		},
		_setupEventListeners : function() {
			var self = this;
			self._.eventListeners = {
				'change' : []
			};
		},
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
		_change : function(changedAttrName, changedValue) {
			var self = this;
			var changedModelRef = this;
			// Trigger event.
			self._trigger('change', changedModelRef, changedAttrName, changedValue);
		},
		_trigger : trigger,
		// CONSTRUCTOR FUNCTION
		init : function(data) {
			this._super();
			this._setupEventListeners();
			this._initObj(data || {});
			this._initSubscriptionRegistry();
			this._initChangeSubscribe();
		},
		// CUSTOM OBJECT INITIALIZE FUNCTION
		initObj : function() {
		},
		// PUBLIC FUNCTIONS
		on : on,
		getJSON : function() {
			CoreApp.Exception.throwIt("getJSON function is decelered, but not defined");
		},
		getJS : function() {
			CoreApp.Exception.throwIt("getJS function is decelered, but not defined");
		},
		getAttributes : function() {
			CoreApp.Exception.throwIt("getAttributes function is decelered, but not defined");
		}
	};

	// DEFINE STORE STRUCTURE
	var StorePrototype = {
		// PROPERTIES
		model : '',
		// PRIVATE FUNCTIONS
		_setupEventListeners : function() {
			var self = this;
			self._.eventListeners = {
				addOne : [],
				addAll : [],
				removeOne : [],
				removeAll : [],
				changeOne : []
			}
		},
		_initModel : function() {
			var self = this;
			var model = self.model
			var TempClass = null;
			TempClass = CoreApp.evaluate(model);
			self._.model = TempClass;
		},
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
		_initObj : function() {
			var self = this;
			var args = Array.prototype.slice.call(arguments, 0)
			self._.collection = ko.observableArray([]);
			self.initObj.apply(self, args);
		},
		_trigger : trigger,
		// CONSTRUCTOR FUNCTION
		init : function() {
			var self = this;
			self._setupEventListeners();
			self._initModel();
			self._initObj();
		},
		// CUSTOM OBJECT INITIALIZE FUNCTION
		initObj : function() {
		},
		// PUBLIC FUNCTIONS
		on : on,
		getModel : function() {
			var self = this
			return self._.model
		},
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
		readOne : function(model) {
			// Needs to implement if require
		},
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
		// PROPERTIES
		autoRender : true,
		saveDomRef : true,
		targetDOM : 'body',
		template : '',
		modelConfig : {},
		storeConfig : {},
		childViewmodelConfig : {

		},
		// PRIVATE FUNCTIONS
		_setupEventListeners : function() {
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
		_initChildViewmodels : function() {
			var self = this;
			var childVmConfig = self.childViewmodelConfig;
			var childViewmodels = {};
			var TempClass = null;
			for (var childVmAlias in childVmConfig) {
				TempClass = CoreApp.evaluate(childVmConfig[childVmAlias]);
				childViewmodels[childVmAlias] = new TempClass();
				childViewmodels[childVmAlias].getParent = function() {

				}
			}
			self._.childViewmodels = childViewmodels;
		},
		_templateCompile : function(htmlString) {
			return htmlString ? $('<div>').html(htmlString)[0] : $('<div>')[0];
		},
		_renderDOMs : function($animateFn, $delay) {
			var self = this;
			var $renderableDoms = self._.$domRef
			$(self.targetDOM).append($renderableDoms);
			if ($renderableDoms) {
				$delay = $delay || 0;
				$(self.targetDOM)[$animateFn]($delay);
			}
		},
		_loadTemplate : function() {
			var self = this;
			return CoreApp.managers.Template.load(self.template);
		},
		_initObj : function() {
			var self = this;
			var args = Array.prototype.slice.call(arguments, 0)
			self.initObj.apply(self, args);
		},
		_refreshTemplate : function(renderDOM) {
			var self = this;
			var $targetDOM = $(self.targetDOM);
			renderDOM = renderDOM || true;

			// Clean existing template content
			if ($targetDOM && $targetDOM.length) {

				// Deattach all jQuery event binding
				$targetDOM.off()

				$.each($targetDOM.children(), function(elemIndex, node) {
					// Deattach knockout binding and remove node within target DOM
					ko.removeNode(node);
				});

				// Deattach knockout binding at target DOM
				ko.cleanNode($targetDOM[0]);
			}

			// Redo template read, compile and render process
			self._initTemplate().done(function(string) {
				if (renderDOM)
					self._renderTemplate(string)
			});
		},
		_koApplyBindings : function(data, node) {
			var self = this;
			node = node || self._.domRef;
			ko.applyBindingsToDescendants(data, node);
		},
		_templateProcess : function(templateString) {
			var self = this;
			var doms = self._templateCompile(templateString);
			if (self.saveDomRef) {
				self._.domRef = doms;
				self._.$domRef = $(doms).children();
			}
			self._trigger('templateReady', doms);
		},
		_renderTemplate : function(htmlString) {
			var self = this
			self._templateProcess(htmlString)
			self._trigger('beforeRenderTemplate');
			self._renderDOMs('fadeIn', 500);
			self._trigger('afterRenderTemplate');
		},
		_initTemplate : function() {
			var self = this;
			var deferred = $.Deferred();
			if (!self.template) {
				setTimeout( function() {
					var self = this;
					var htmlString = ''
					if (self.autoRender)
						self._renderTemplate(htmlString)
					deferred.resolve(htmlString);
				}.bind(self), 1);
			} else {
				self._loadTemplate(self.template).done( function(htmlString) {
					var self = this;
					if (self.autoRender)
						self._renderTemplate(htmlString)
					deferred.resolve(htmlString);
				}.bind(self)).fail(function() {
					deferred.reject('');
				});
			}
			return deferred;
		},
		_trigger : trigger,
		// CONSTRUCTOR FUNCTION
		init : function() {
			var self = this;
			self._setupEventListeners();
			self._initObj();
			self._initModels();
			self._initStores();
			// Trigger on after init model
			self._trigger('modelReady', self._.models);

			// Trigger on after init store
			self._trigger('storeReady', self._.stores);

			self._initTemplate().always(function() {
				self._initChildViewmodels();
				self._trigger('afterViewmodelInit');
			});

		},
		// CUSTOM OBJECT INITIALIZE FUNCTION
		initObj : function() {
		},
		// PUBLIC FUNCTIONS
		on : on,
		getModel : function(modelName) {
			var self = this;
			var model = self._.models[modelName]
			if (!model) {
				CoreApp.Exception.throwIt(modelName + ' store doesn\'t exist in current ViewModel');
				return {};
			}
			return model;
		},
		getStore : function(storeName) {
			var self = this;
			var store = self._.stores[storeName]
			if (!store) {
				CoreApp.Exception.throwIt(storeName + ' store doesn\'t exist in current ViewModel');
				return {};
			}
			return store;
		},
		getComponent: function(viewmodelName) {
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
		_setupEventListeners : function() {
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
			self._setupEventListeners();
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
		_setupEventListeners : function() {
			var self = this;
			self._.eventListeners = {
			};
		},
		// CONSTRUCTOR
		init : function() {
			var self = this;
			self._setupEventListeners();
		},
		// PUBLIC FUNCTIONS
		registerEvent : function(eventNames) {
			var self = this;
			if (CoreApp.utils.isString(eventNames))
				eventNames = eventNames.split(',')
			eventNames.forEach(function(eventName) {
				if (!self._.eventListeners[eventName]) {
					self._.eventListeners[eventName] = [];
				} else {
					CoreApp.Exception.throwIt('Event registration failed, because ' + eventName + ' event already exist');
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
				}, 1);
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
