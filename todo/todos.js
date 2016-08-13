/**
 * Created by qujingkun on 16/8/11.
 */
$(function(){
    var Todo = Backbone.Model.extend({
        defaults: function() {
            return {
                title: "empty",
                order: Todos.nextOrder(),
                done: false
            };
        },

        toggle: function() {
            //保存模型到数据库 save将会立即触发一个change事件 模型初次保存create请求,第二次update请求
            this.save({done: !this.get("done")});
        }

    });

    var TodoList = Backbone.Collection.extend({

        //指定集合中包含的模型类
        model: Todo,

        // 存储到浏览器,以todos-backbone的命名空间内
        localStorage: new Backbone.LocalStorage("todos-backbone"),


        //返回集合中所有匹配所传递 attributes（属性）的模型数组。
        done: function() {
            return this.where({done: true});
        },

        // //返回集合中所有匹配所传递 attributes（属性）的模型数组。
        remaining: function() {
            return this.where({done: false});
        },

        //定义序号函数
        nextOrder: function() {
            if (!this.length) return 1;
            // return this.last().get('order') + 1;
            return this.length;
        },

        //集合中的模型会按照顺序排序,被增加的模型会被插入到合适的位置
        comparator: 'order'

    });


    var Todos = new TodoList;

    // Todo Item View

    var TodoView = Backbone.View.extend({

        //把template模板中获取到的html代码放到这标签中 等价于el:'body'
        tagName:  "li",

        // underscore的template
        template: _.template($('#item-template').html()),

        // jQuery 事件  html元素事件触发view的events
        events: {
            "click .toggle"   : "toggleDone",
            //双击事件
            "dblclick .view"  : "edit",
            "click a.destroy" : "clear",
            //键盘按下
            "keypress .edit"  : "Enter",
            //元素失去焦点
            "blur .edit"      : "close"
        },
        //view监听模型的事件 进行渲染或移除操作
        initialize: function() {
            //object.listenTo(other, event, callback)
            //监听model的change事件,一旦触发,调用render函数
            this.listenTo(this.model, 'change', this.render);
            //监听model的destory事件,一旦触发,调用remove函数
            this.listenTo(this.model, 'destroy', this.remove);
        },

        // 实现从模型数据渲染视图模板，并可用新的 HTML 更新 this.el。 推荐的做法是在 render 函数的末尾 return this 以开启链式调用。
        render: function() {
            //this.el 可以从视图的 tagName, className, id 和 attributes 创建，如果都未指定，el 会是一个空 div。
            //$el 一个视图元素的缓存jQuery对象。
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.toggleClass('done', this.model.get('done'));
            this.input = this.$('.edit');
            return this;
        },
        toggleDone: function() {
            this.model.toggle();
        },
        edit: function() {
            this.$el.addClass("editing");
            this.input.focus();
        },
        close: function() {
            var value = this.input.val();
            if (value) {
                this.model.save({title: value});
                this.$el.removeClass("editing");
            } else {
                this.clear();
            }
        },
        Enter: function(e) {
            if (e.keyCode == 13) this.close();
        },
        clear: function() {
            //通过委托一个HTTP DELETE请求给Backbone.sync破坏服务器上的模型。
            this.model.destroy();
        }

    });

    var AppView = Backbone.View.extend({
        el: $("#app"),
        statsTemplate: _.template($('#stats-template').html()),
        events: {
            "keypress #new-todo":  "createOnEnter",
            "click #clear-completed": "clearCompleted",
            "click #toggle-all": "toggleAllComplete"
        },
        initialize: function() {
            this.input = this.$("#new-todo");
            this.allCheckbox = this.$("#toggle-all")[0];
            //向集合中增加一个模型（或一个模型数组），触发"add"事件。
            this.listenTo(Todos, 'add', this.addOne);

            //在往collection中添加model时执行的，即添加的model都会注册一个“all”事件
            this.listenTo(Todos, 'all', this.render);
            this.footer = this.$('footer');
            this.main = $('#main');
            //从服务器拉取集合的默认模型设置 ，成功接收数据后会setting（设置）集合
            Todos.fetch();
        },
        render: function() {
            var done = Todos.done().length;
            var remaining = Todos.remaining().length;
            if (Todos.length) {
                this.main.show();
                this.footer.show();
                this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
            } else {
                this.main.hide();
                this.footer.hide();
            }
            this.allCheckbox.checked = !remaining;
        },
        addOne: function(todo) {
            alert("one");
            var view = new TodoView({model: todo});
            this.$("#todo-list").append(view.render().el);
        },
        createOnEnter: function(e) {
            if (e.keyCode != 13) return;
            if (!this.input.val()) return;
            //方便的在集合中创建一个模型的新实例。 相当于使用属性哈希（键值对象）实例化一个模型， 然后将该模型保存到服务器， 创建成功后将模型添加到集合中。 返回这个新模型。
            Todos.create({title: this.input.val()});
            this.input.val('');
        },
        clearCompleted: function() {
            //把每个做过的model都调用他们的destory方法
            _.invoke(Todos.done(), 'destroy');
            return false;
        },

        toggleAllComplete: function () {
            var done = this.allCheckbox.checked;
            Todos.each(function (todo) { todo.save({'done': done}); });
        }

    });
    var App = new AppView;

});
