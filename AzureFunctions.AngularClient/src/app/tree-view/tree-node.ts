import { Disposable } from './tree-node';
import { Subject, Observable } from 'rxjs/Rx';
import {SideNavComponent} from '../side-nav/side-nav.component';
import {DashboardType} from './models/dashboard-type';
import {TreeViewInfo} from './models/tree-view-info';
import {Subscription} from '../shared/models/subscription';

export interface CustomSelection{
    handleSelection();
}

export interface Disposable{
    dispose(newSelectedNode? : TreeNode);
}

export interface Removable{
    remove();
}

export interface Refreshable{
    handleRefresh() : Observable<any>;
}

export interface CanBlockNavChange{
    // Give a node a chance to prevent a user from navigating away
    shouldBlockNavChange() : boolean;
}

export interface Collection{
    loadChildren() : Observable<any>;
}

export interface MutableCollection{
    addChild(child : any);
    removeChild(child : any, callRemoveOnChild? : boolean);
}

export class TreeNode implements Disposable, Removable, CanBlockNavChange, CustomSelection, Collection{
    public isExpanded : boolean;
    public showExpandIcon : boolean = true;
    public iconClass : string;
    public isLoading : boolean;
    public children : TreeNode[] = [];
    public title : string;
    public dashboardType : DashboardType;
    public newDashboardType : DashboardType;
    public supportsRefresh = false;
    public supportsAdvanced = false;
    public supportsScope = false;
    public disabled = false;
    public inSelectedTree = false;

    constructor(
        public sideNav : SideNavComponent,
        public resourceId : string,
        public parent : TreeNode){}

    public select() : void {
        if(this.disabled || !this.resourceId){
            return;
        }


        if(!this.isExpanded){
            this.isExpanded = true;
        }

        if(this.sideNav.selectedNode !== this){

            this.sideNav.updateView(this, this.dashboardType)
            .subscribe(() =>{
            });
        }
    }

    // Virtual
    public handleSelection() : Observable<any>{
        this.isLoading = false;
        return Observable.of(null);
    }

    // Virtual
    public refresh(event? : any){
        this.isLoading = true;
        this.handleRefresh()
        .subscribe(() =>{
            this.sideNav.updateView(this, this.sideNav.selectedDashboardType).subscribe(() =>{});            
            this.isLoading = false;
        });

        if(event){
            event.stopPropagation();
        }
    }

    public handleRefresh() : Observable<any>{
        return Observable.of(null);
    }

    public toggle(event){
        
        if(!this.isExpanded){
            this.isLoading = true;
            this.isExpanded = true;

            this.loadChildren()
            .subscribe(() =>{
                this.isLoading = false;
                if(this.children && this.children.length === 1 && !this.children[0].isExpanded){
                    this.children[0].toggle(null);
                }
            });
        }
        else{
            this.isExpanded = false;
        }

        if(event){
            event.stopPropagation();
        }
    }

    public openCreateNew(event){
        if(this.sideNav.selectedNode !== this){
            this.sideNav.updateView(this, this.newDashboardType).subscribe(() =>{});
        }
    }

    public shouldBlockNavChange() : boolean{
        return false;
    }

    public loadChildren() : Observable<any>{
        return Observable.of(null);
    }

    public dispose(newSelectedNode? : TreeNode){
    }

    public remove(){
    }

    protected _removeHelper(removeIndex : number, callRemoveOnChild? : boolean){
        if(removeIndex > -1){
            let child = this.children[removeIndex];
            this.children.splice(removeIndex, 1);
            
            if(callRemoveOnChild){
                child.remove();
            }

            this.sideNav.clearView(child.resourceId);
        }
    }

    public getTreePathNames(){
        let path : string[] = [];
        let curNode : TreeNode = this;
        
        while(curNode){
            path.splice(0, 0, curNode.title);
            curNode = curNode.parent;
        }

        return path;
    }

    public scopeToNode(){
        this.sideNav.searchExact(this.title);
    }
}