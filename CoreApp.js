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
 * M-S-VM-R
 *
 */
var CoreApp = window.CoreApp || (function() {
	"use strict";

	if (!window.jQuery || !window.ko) {
		throw new Error('Dependency error, Knockout and jQuery doesn\'t exist');
	}

	var CoreApp = {};

	// SETUP CONFIGURATION
	CoreApp.config = {
		basePath : '/'
	};

	// SETUP GLOBAL
	CoreApp.global = {};

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

	// DEFINE MODEL STRUCTURE
	var ModelPrototype = {
		// PRIVATE FUNCTIONS
		_initSubscriptionRegistry : function() {
			this._.subscriptions = [];
		},
		_factory : function(data) {
			CoreApp.Exception.throwIt("Model attribute not initiated, Initiate model attributes in _factory function.");
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
		// "_trigger" function sould come here.
		// CONSTRUCTOR FUNCTION
		init : function(data) {
			this._super();
			this._setupEventListeners();
			this._factory(data || {});
			this._initSubscriptionRegistry();
			this._initChangeSubscribe();
		},
		// PUBLIC FUNCTIONS
		// "on" function sould come here.
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
			TempClass = CoreApp.Application.evaluate(model);
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
		_factory : function() {
			var self = this;
			self._.collection = ko.observableArray([]);
		},
		// "_trigger" function sould come here.
		// CONSTRUCTOR FUNCTION
		init : function() {
			var self = this;
			self._setupEventListeners();
			self._initModel();
			self._factory();
		},
		// PUBLIC FUNCTIONS
		// "on" function sould come here.
		addOne : function(dataItem) {
			var self = this;
			var model = new self._.model(dataItem);
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
			if (dataItems.length > 0) {
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
		storeConfig : {},

		// PRIVATE FUNCTIONS
		_setupEventListeners : function() {
			var self = this;
			self._.eventListeners = {
				storeReady : [],
				templateReady : [],
				beforeRenderTemplate : [],
				afterRenderTemplate : [],
				afterViewmodelInit : []
			}
		},
		_initStores : function() {
			var self = this;
			var storeConfig = self.storeConfig;
			var stores = {};
			var TempClass = null;
			for (var storeAlias in storeConfig) {
				TempClass = CoreApp.Application.evaluate(storeConfig[storeAlias]);
				stores[storeAlias] = new TempClass();
			}
			self._.stores = stores;
		},
		_templateCompile : function(htmlString) {
			return $('<div>').html(htmlString).find(">*")[0];
		},
		_renderDOMs : function(doms, $animateFn, $delay) {
			var self = this;
			$(self.targetDOM).append(doms);
			if ($animateFn) {
				$delay = $delay || 0;
				$(doms)[$animateFn]($delay);
			}
		},
		_loadTemplate : function() {
			var self = this;
			return CoreApp.Application.loadTemplate(self.template);
		},
		_factory : function() {
			CoreApp.Exception.throwIt("ViewModel attribute not initiated, Initiate viewmodel attributes in _factory function.");
		},
		// "_trigger" function sould come here.
		// CONSTRUCTOR FUNCTION
		init : function() {
			var self = this;
			self._setupEventListeners();
			self._initStores();
			self._factory();

			// Trigger on after init store
			self._trigger('storeReady', self._.stores);

			var templateProcess = function(templateString) {
				var doms = self._templateCompile(templateString);
				if (self.saveDomRef) {
					self._.domRef = doms;
				}
				self._trigger('templateReady', doms);
				if (self.autoRender) {
					self._trigger('beforeRenderTemplate', doms);
					self._renderDOMs(doms);
					self._trigger('afterRenderTemplate', doms);
				}
			};
			if (self.template) {
				self._loadTemplate(self.template).done(templateProcess).always(function() {
					self._trigger('afterViewmodelInit');
				});
			} else {
				templateProcess('');
				self._trigger('afterViewmodelInit');
			}
		},
		// PUBLIC FUNCTIONS
		// "on" function sould come here.
	};

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

	// COMMON FUNCTION OVER PROTOTYPES
	ModelPrototype._trigger = StorePrototype._trigger = ViewmodelPrototype._trigger = trigger;
	ModelPrototype.on = StorePrototype.on = ViewmodelPrototype.on = on;

	// EXTEND MODEL, STORE, VIEWMODEL PROTOTYPES FROM BASE CLASS
	CoreApp.models = CoreApp.models || {};
	CoreApp.models.BaseModel = CoreApp.BaseClass.extend(ModelPrototype);
	CoreApp.stores = CoreApp.stores || {};
	CoreApp.stores.BaseStore = CoreApp.BaseClass.extend(StorePrototype);
	CoreApp.viewmodels = CoreApp.viewmodels || {};
	CoreApp.viewmodels.BaseViewmodel = CoreApp.BaseClass.extend(ViewmodelPrototype);

	// DEFINE PROXY STRUCTURE
	var ProxyPrototype = {
		store : {},
		url : "",
		getData : function() {
			throw new Error(" function is not defined ");
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
		_initRoutes : function() {
			var self = this;
			self._.routes = {};
			self._.routeMap = {};
		},
		// INITIALIZE ROUTER
		init : function() {
			var self = this;
			self._setupEventListeners();
			self._initRoutes();
		},
		// PUBLIC FUNCTIONS
		createRoute : function(key, hash, cb, name, parentKey, rootKey) {
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
		createRoutes : function(route, key) {
			var self = this;
			key = key || ('route' + Math.random().toString().split('.')[1]);
			self.createRoute(key, route.hash, route.cb, route.name, route.parent, route.root);
		},
		getHierarchy : function() {

		},
		getRoute : function() {

		},
		getAllRoutes : function() {

		},
		reload : function() {

		},
		redirect : function() {

		},
		load : function(hash) {
			var self = this;
			var routeRef = self.lookup(hash);
			var routeMap = self._.routeMap[routeRef.ref];
			routeMap.cb.call(routeRef.params);

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

	// DEFINE TEMPLATE LOAD MANAGER
	var Template = {
		config : {
			holder : '',
			pathPrefix : 'templates/',
			extension : 'html'
		},
		load : function(template) {
			var basePath = CoreApp.config.basePath;
			var deferred = $.Deferred();
			var self = this;
			var config = self.config;

			var templateName = template;
			var pathPrefix = config.pathPrefix || '/';
			var extension = '.' + (config.extension || 'html');
			var url = basePath + pathPrefix + templateName + extension;

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
		var checkLoadedModule = function(module) {
			return !!CoreApp.evaluate(module)
		};
		if (CoreApp.utils.isString(modules))
			modules = modules.split(',')

		modules.forEach(function(module) {
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
			return toString.call(obj) === '[object Array]';
		},
		isString : function(obj) {
			return toString.call(obj) === '[object String]';
		}
	};

	return CoreApp;
})();
