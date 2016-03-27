﻿using System;
using System.Collections.Generic;
using DotVVM.Framework.Compilation.Parser.Dothtml.Parser;

namespace DotVVM.Framework.Compilation.ControlTree.Resolved
{
    public class ResolvedTreeRoot : ResolvedContentNode, IAbstractTreeRoot
    {
        public Dictionary<string, string> Directives { get; set; } = new Dictionary<string, string>(StringComparer.InvariantCultureIgnoreCase);

        public ResolvedTreeRoot(ControlResolverMetadata metadata, DothtmlNode node, DataContextStack dataContext)
            : base(metadata, node, dataContext)
        {
        }
        

        public override void Accept(IResolvedControlTreeVisitor visitor)
        {
            visitor.VisitView(this);
        }
    }
}